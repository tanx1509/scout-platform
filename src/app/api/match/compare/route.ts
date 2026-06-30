import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { aiProvider } from "@/lib/ai/provider";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  await requireAuth();

  try {
    const { jobId, candidateIds } = await req.json();

    if (!jobId || !Array.isArray(candidateIds) || candidateIds.length < 2) {
      return NextResponse.json({ error: "jobId and at least 2 candidateIds required" }, { status: 400 });
    }

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    const candidates = await prisma.candidate.findMany({
      where: { id: { in: candidateIds } },
      include: { profile: true }
    });

    const prompt = `
You are an expert AI Technical Recruiter.
Compare the following candidates for the job: ${job.title}.

Job Requirements:
${JSON.stringify(job.structuredData, null, 2)}

Candidates:
${candidates.map(c => `
Candidate ${c.id} (${c.name}):
${JSON.stringify(c.profile, null, 2)}
`).join('\n')}

Generate an "AI Verdict" comparing these candidates.
Respond STRICTLY with a JSON object in this format:
{
  "recommendedCandidateId": "string (The ID of the best candidate)",
  "verdict": "One clear paragraph explaining why this candidate is the best choice overall.",
  "comparisons": {
    "candidate_id_1": {
      "pros": ["string"],
      "cons": ["string"]
    },
    "candidate_id_2": {
      "pros": ["string"],
      "cons": ["string"]
    }
  }
}
`;

    const aiResponse = await aiProvider.generateText(prompt, "You are a specialized AI recruitment reasoning engine.", true);
    
    return NextResponse.json(JSON.parse(aiResponse));
  } catch (error) {
    console.error("Compare API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
