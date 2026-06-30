import { Agent, AgentContext, AgentEvent, AgentResult } from "../core/interfaces";
import { prisma } from "@/lib/db/prisma";
import { DocumentParserTool } from "../tools/document-parser";

export class ResumeAgent implements Agent {
  name = "ResumeAgent";

  canHandle(event: AgentEvent): boolean {
    return event.type === "RESUME_UPLOADED";
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const toolsUsed: string[] = ["DocumentParserTool"];
    const reasoning: string[] = [];
    const candidate = context.candidate;

    if (!candidate.resume || !candidate.resume.sourceUrl) {
      return {
        success: false,
        confidence: 0,
        reasoning: ["No resume URL provided."],
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: null,
        requiresHumanReview: true
      };
    }

    try {
      reasoning.push(`Attempting to parse resume from: ${candidate.resume.sourceUrl}`);
      
      const docTool = new DocumentParserTool();
      const parseResult = await docTool.execute({
        fileUrl: candidate.resume.sourceUrl,
        type: "RESUME"
      });

      if (!parseResult.success) {
        throw new Error(parseResult.error || "Unknown parsing error");
      }

      reasoning.push("Successfully parsed resume text.");

      // Update resume status
      await prisma.resume.update({
        where: { id: candidate.resume.id },
        data: {
          status: "PARSED",
          rawText: parseResult.data.text,
          parsingConfidence: 85, // Mock confidence
          parsedAt: new Date()
        }
      });

      return {
        success: true,
        confidence: 0.85,
        reasoning,
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: {
          textLength: parseResult.data.text?.length || 0,
          status: "PARSED"
        },
        requiresHumanReview: false
      };
    } catch (e) {
      console.error("Resume parsing failed:", e);
      reasoning.push(`Failed to parse resume: ${String(e)}`);
      
      // Fallback gracefully: If Drive link is blocked, we still have the dataset fields
      reasoning.push("Falling back to dataset fields (best_ai_project, research_work) for evaluation.");
      
      // Update resume status to failed but don't fail the agent completely 
      // since we can still evaluate based on dataset fields
      if (candidate.resume && candidate.resume.id) {
        await prisma.resume.update({
          where: { id: candidate.resume.id },
          data: {
            status: "FAILED",
            errorMessage: String(e)
          }
        });
      }

      return {
        success: true, // Returning true to not block the pipeline, but with lower confidence
        confidence: 0.3,
        reasoning,
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: {
          status: "FALLBACK_TO_DATASET"
        },
        requiresHumanReview: true
      };
    }
  }
}
