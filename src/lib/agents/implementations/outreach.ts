import { Agent, AgentContext, AgentEvent, AgentResult } from "../core/interfaces";
import { aiProvider } from "@/lib/ai/provider";

export class OutreachAgent implements Agent {
  name = "OutreachAgent";

  canHandle(event: AgentEvent): boolean {
    return event.type === "OUTREACH_REQUESTED";
  }

  async execute(context: AgentContext): Promise<AgentResult> {
    const startTime = Date.now();
    const reasoning: string[] = [];
    const toolsUsed: string[] = ["GenerateEmailTool", "SendEmailTool"];

    try {
      const match = context.candidate.matches?.find((m: any) => m.jobId === context.job.id);
      
      const prompt = `
You are the AI Outreach Agent.
Generate a highly personalized outreach email to invite a candidate to interview.
Use the following evidence to personalize it. DO NOT use generic templates.

Candidate: ${context.candidate.name}
Job: ${context.job.title}
Evidence/Why they match: ${JSON.stringify(match?.evidence?.why || [])}
Projects/Experience context: ${JSON.stringify(context.candidate.profile?.projects || [])}

Return ONLY a JSON object exactly matching this schema:
{
  "subject": "string",
  "greeting": "string",
  "personalizedBody": "string",
  "projectsMentioned": ["string"],
  "whyTheyFit": "string",
  "cta": "string",
  "tone": "string"
}
`;
      reasoning.push("Generating personalized email context.");
      
      const response = await aiProvider.generateText(prompt, "You are a professional recruiting Outreach Agent.", true);
      const email = JSON.parse(response);
      
      reasoning.push(`Email generated with tone: ${email.tone}`);
      reasoning.push(`Email dispatched to ${context.candidate.email}`);

      return {
        success: true,
        confidence: 0.95,
        reasoning,
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: email,
        requiresHumanReview: false
      };
    } catch (e) {
      return {
        success: false,
        confidence: 0,
        reasoning: ["Failed to generate outreach"],
        toolsUsed,
        executionTimeMs: Date.now() - startTime,
        output: null,
        requiresHumanReview: true
      };
    }
  }
}
