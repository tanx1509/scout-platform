import { aiProvider } from "../ai/provider";

export interface ParsedJobDescription {
  title: string;
  department?: string;
  requiredSkills: string[];
  preferredSkills: string[];
  techStack: string[];
  experience: string[];
  softSkills: string[];
  hiringIntent: string;
  teamExpectations: string[];
  responsibilities: string[];
  radarAxes: string[];
}

const SYSTEM_PROMPT = `
You are an expert technical recruiter and AI.
Extract structured information from the provided Job Description.
Respond ONLY with a JSON object strictly matching this schema:
{
  "title": "string (The job title)",
  "department": "string or null",
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "techStack": ["string"],
  "experience": ["string (e.g., '3+ years of Python')"],
  "softSkills": ["string"],
  "hiringIntent": "string (Why are they hiring? e.g., 'Backfill', 'Growth', 'New Team')",
  "teamExpectations": ["string (e.g., 'Fast-paced', 'Agile')"],
  "responsibilities": ["string"],
  "radarAxes": ["string (Exactly 6 dynamic skills/categories critical for this specific role)"]
}
If a field is missing or unstated, return an empty array or null appropriately.
`;

export async function parseJobDescription(rawText: string): Promise<ParsedJobDescription | null> {
  const jsonResponse = await aiProvider.generateText(rawText, SYSTEM_PROMPT, true);
  try {
    const parsed = JSON.parse(jsonResponse) as ParsedJobDescription;
    return parsed;
  } catch (error) {
    console.error("Failed to parse JD JSON from LLM:", error);
    return null;
  }
}
