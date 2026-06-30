import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { matchCandidateToJob } from "@/lib/matcher/engine";

export async function POST(req: NextRequest) {
  await requireAuth();

  try {
    const { jobId, candidateId } = await req.json();

    if (!jobId || !candidateId) {
      return NextResponse.json({ error: "jobId and candidateId are required" }, { status: 400 });
    }

    const result = await matchCandidateToJob(candidateId, jobId);
    
    if (!result) {
      return NextResponse.json({ error: "Failed to generate match. Missing profile or job data." }, { status: 400 });
    }

    const matchData = {
      jobId,
      candidateId,
      overallScore: result.overallScore,
      technicalScore: result.technicalScore,
      projectScore: result.projectScore,
      researchScore: result.researchScore,
      resumeScore: result.resumeScore,
      assessmentScore: result.assessmentScore,
      githubScore: result.githubScore,
      communicationScore: result.communicationScore,
      educationScore: result.educationScore,
      jdAlignmentScore: result.jdAlignmentScore,
      riskPenalty: result.riskPenalty,
      recommendation: result.recommendation,
      confidence: result.confidence,
      hiringRank: result.hiringRank,
      evidence: result.evidence as any,
      risks: result.risks as any,
      interviewFocus: result.interviewFocus as any,
      summary: result.summary,
    };

    const match = await prisma.jobMatch.upsert({
      where: {
        jobId_candidateId: {
          jobId,
          candidateId,
        },
      },
      create: matchData,
      update: matchData,
    });

    return NextResponse.json(match, { status: 200 });
  } catch (error) {
    console.error("Match API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
