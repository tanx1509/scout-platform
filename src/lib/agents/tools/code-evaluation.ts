import { Tool, ToolResult } from "../core/interfaces";
import { aiProvider } from "@/lib/ai/provider";

export class CodeEvaluationTool implements Tool {
  name = "CodeEvaluationTool";

  async execute(input: { parsedContent: string; jobContext: any }): Promise<ToolResult> {
    const prompt = `
You are an expert Principal AI Software Engineer.
Evaluate this candidate's submitted assessment (code or document).

Job Requirements:
${JSON.stringify(input.jobContext, null, 2)}

Assessment Content:
${input.parsedContent.substring(0, 5000)}

Return ONLY a JSON object exactly matching this schema:
{
  "correctness": "number (0-100)",
  "codeQuality": "number (0-100)",
  "timeComplexity": "string (e.g., O(n))",
  "readability": "string (comments on style/structure)",
  "missingConcepts": ["string"],
  "strengths": ["string"],
  "weaknesses": ["string"]
}
`;

    try {
      const response = await aiProvider.generateText(prompt, "You are a code evaluator AI.", true);
      return { success: true, data: JSON.parse(response) };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Eval failed" };
    }
  }
}
