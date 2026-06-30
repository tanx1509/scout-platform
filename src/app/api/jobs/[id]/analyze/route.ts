import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/provider";
import prisma from "@/lib/db/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const job = await prisma.job.findUnique({
      where: { id: resolvedParams.id }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // 1. Deterministic Metrics
    const wordCount = job.rawText.split(/\s+/).length;
    const requirements = (job.structuredData as any)?.requiredSkills?.length || 0;
    const preferred = (job.structuredData as any)?.preferredSkills?.length || 0;
    
    const deterministic = {
      wordCount,
      requirementsCount: requirements,
      preferredCount: preferred,
      estimatedReadingLevel: wordCount > 500 ? "Advanced" : "Intermediate",
      yearsExperience: (job.structuredData as any)?.experience?.length ? 1 : 0 // Simplified
    };

    // 2. LLM Reasoning
    const prompt = `
Analyze this job description for quality, restrictiveness, bias, and clarity.
Job Title: ${job.title}
Job Description:
${job.rawText.substring(0, 3000)}

Return ONLY a JSON object exactly matching this schema:
{
  "jdSummary": "A concise 2-sentence summary of the role",
  "ambiguity": ["List of ambiguous phrases or unclear requirements"],
  "missingInformation": ["Crucial information missing (e.g. salary, location, tech stack)"],
  "inclusivenessSuggestions": ["Actionable suggestions to improve inclusiveness/gender-neutrality"],
  "difficultyLevel": "string (e.g., 'Entry Level', 'Mid-Level', 'Staff/Principal')",
  "restrictivenessScore": 1-100 (100 being excessively restrictive)
}
`;

    const aiRes = await aiProvider.generateText(prompt, "You are an expert HR Analyst.", true);
    const llmReasoning = JSON.parse(aiRes);

    const analysis = await prisma.jobAnalysis.upsert({
      where: { jobId: resolvedParams.id },
      create: {
        jobId: resolvedParams.id,
        deterministic,
        llmReasoning
      },
      update: {
        deterministic,
        llmReasoning
      }
    });

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Job Analysis API Error:", error);
    return NextResponse.json({ error: "Failed to analyze JD" }, { status: 500 });
  }
}
