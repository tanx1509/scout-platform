import { Agent, AgentContext, AgentEvent, AgentResult } from "../core/interfaces";
import { DocumentParserTool } from "../tools/document-parser";
import { CodeEvaluationTool } from "../tools/code-evaluation";
import { prisma } from "@/lib/db/prisma";

export class AssessmentAgent implements Agent {
  name = "AssessmentAgent";

  canHandle(event: AgentEvent): boolean {
    return event.type === "ASSESSMENT_UPLOADED";
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const docTool = new DocumentParserTool();
    const evalTool = new CodeEvaluationTool();
    const toolsUsed: string[] = [];
    const reasoning: string[] = [];

    try {
      // 1. Parse document
      const docRes = await docTool.execute({
        fileUrl: context.event.payload.fileUrl,
        rawContent: context.event.payload.rawContent,
        type: context.event.payload.type
      });
      toolsUsed.push(docTool.name);
      if (!docRes.success) throw new Error(docRes.error);
      reasoning.push(`Successfully parsed ${docRes.data.type} document.`);

      // 2. Evaluate code
      const evalRes = await evalTool.execute({
        parsedContent: docRes.data.text,
        jobContext: context.job.structuredData
      });
      toolsUsed.push(evalTool.name);
      if (!evalRes.success) throw new Error(evalRes.error);
      reasoning.push(`AI Evaluation complete. Score: ${evalRes.data.score}`);

      // 3. Update Assessment & JobMatch in DB
      await prisma.assessment.create({
        data: {
          candidateId: context.candidate.id,
          jobId: context.job.id,
          fileUrl: context.event.payload.fileUrl,
          rawContent: context.event.payload.rawContent,
          score: evalRes.data.score,
          feedback: {
            strengths: evalRes.data.strengths,
            weaknesses: evalRes.data.weaknesses,
            missingConcepts: evalRes.data.missingConcepts,
            interviewQuestions: evalRes.data.interviewQuestions
          }
        }
      });

      // Automatically adjust recommendation if score is very low
      const requiresHumanReview = evalRes.data.score < 60;
      if (requiresHumanReview) {
        reasoning.push("Score below 60. Downgrading recommendation flag and requesting human review.");
      } else {
        reasoning.push("Assessment passed successfully.");
      }

      // Update Match Status
      await prisma.jobMatch.update({
        where: { jobId_candidateId: { jobId: context.job.id, candidateId: context.candidate.id } },
        data: { status: "ASSESSMENT" }
      });

      return {
        success: true,
        confidence: evalRes.data.score / 100,
        reasoning,
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: evalRes.data,
        requiresHumanReview,
        // No automatic next event, waits for Recruiter to schedule interview
      };
    } catch (e) {
      return {
        success: false,
        confidence: 0,
        reasoning: ["Failed to process assessment", String(e)],
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: null,
        requiresHumanReview: true
      };
    }
  }
}
