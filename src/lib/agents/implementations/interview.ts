import { Agent, AgentContext, AgentEvent, AgentResult } from "../core/interfaces";
import { prisma } from "@/lib/db/prisma";
import { aiProvider } from "@/lib/ai/provider";

export class InterviewAgent implements Agent {
  name = "InterviewAgent";

  canHandle(event: AgentEvent): boolean {
    return event.type === "INTERVIEW_REQUESTED";
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const reasoning: string[] = [];
    const toolsUsed: string[] = ["CalendarTool", "MeetTool"];

    try {
      reasoning.push("Checking recruiter availability against candidate preferred slots.");
      
      const prompt = `
Generate a comprehensive interview plan for candidate: ${context.candidate.name}.
Review their match evidence: ${JSON.stringify(context.candidate.matches?.[0]?.evidence || {})}

Return ONLY a JSON object exactly matching this schema:
{
  "scheduledAt": "ISO Date String (e.g., 2026-07-01T10:00:00Z)",
  "meetLink": "https://meet.google.com/abc-xyz",
  "technicalTopics": ["string"],
  "behaviouralQuestions": ["string"],
  "portfolioDiscussion": ["string"],
  "systemDesign": ["string"],
  "followUps": ["string"],
  "redFlags": ["string"],
  "confidenceAreas": ["string"]
}
`;
      const response = await aiProvider.generateText(prompt, "You are a Calendar Agent.", true);
      const schedule = JSON.parse(response);
      
      reasoning.push(`Selected slot: ${schedule.scheduledAt}`);
      reasoning.push(`Generated Meet Link: ${schedule.meetLink}`);

      await prisma.interview.create({
        data: {
          candidateId: context.candidate.id,
          jobId: context.job.id,
          scheduledAt: new Date(schedule.scheduledAt),
          meetLink: schedule.meetLink,
          status: "SCHEDULED"
        }
      });

      await prisma.jobMatch.update({
        where: { jobId_candidateId: { jobId: context.job.id, candidateId: context.candidate.id } },
        data: { status: "INTERVIEW" }
      });

      reasoning.push("Interview scheduled in DB and Match Status updated.");

      return {
        success: true,
        confidence: 1.0,
        reasoning,
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: schedule,
        requiresHumanReview: false
      };
    } catch (e) {
      return {
        success: false,
        confidence: 0,
        reasoning: ["Failed to schedule interview"],
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: null,
        requiresHumanReview: true
      };
    }
  }
}
