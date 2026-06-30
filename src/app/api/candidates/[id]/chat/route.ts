import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { aiProvider } from "@/lib/ai/provider";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const { question, jobId } = await req.json();

    if (!question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: resolvedParams.id },
      include: { profile: true, githubCache: true, assessments: true },
    });

    if (!candidate || !candidate.profile) {
      return NextResponse.json({ error: "Candidate or profile not found" }, { status: 404 });
    }

    let jobData = null;
    let matchEvidence = null;

    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId } });
      if (job) jobData = job.structuredData;

      const match = await prisma.jobMatch.findUnique({
        where: { jobId_candidateId: { jobId, candidateId: resolvedParams.id } }
      });
      if (match) matchEvidence = match;
    }

    const systemPrompt = `
You are an expert technical recruiter assistant (Copilot).
Your task is to answer questions about the provided Candidate.
Keep your answers very concise, direct, and recruiter-focused (max 2-3 short paragraphs).
Support: Summarize Candidate, Compare against JD, Missing Skills, Interview Questions, Hiring Risks, Portfolio Questions, Behavioural Questions, Strengths, Weaknesses.
If a Job Description is provided, relate your answer to the job requirements.

Candidate Profile:
${JSON.stringify(candidate.profile, null, 2)}

GitHub Stats:
${JSON.stringify(candidate.githubCache?.data || {}, null, 2)}

Job Description:
${jobData ? JSON.stringify(jobData, null, 2) : "No specific job provided."}

Match Evidence:
${matchEvidence ? JSON.stringify(matchEvidence, null, 2) : "No match evidence available."}

Assessments:
${candidate.assessments.length > 0 ? JSON.stringify(candidate.assessments, null, 2) : "No assessments available."}
`;

    const answer = await aiProvider.generateText(question, systemPrompt, false);

    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    console.error("Copilot Chat Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
