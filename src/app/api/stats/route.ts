import { requireAuth } from "@/lib/auth/session";
import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth();
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [
      uploaded,
      resumeParsed,
      githubAnalysed,
      eligible,
      assessmentPassed,
      interviewReady,
      recentActivities,
      topCandidatesRaw
    ] = await Promise.all([
      prisma.candidate.count(),
      prisma.resume.count({ where: { status: 'PARSED' } }),
      prisma.githubCache.count(),
      prisma.jobMatch.count({ where: { status: { in: ['OFFER', 'HIRED', 'INTERVIEW', 'ASSESSMENT', 'SCREENING'] } } }),
      prisma.assessment.count({ where: { OR: [{ logicalScore: { gte: 70 } }, { codingScore: { gte: 70 } }] } }),
      prisma.jobMatch.count({ where: { status: 'INTERVIEW' } }),
      prisma.agentActivity.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10
      }),
      prisma.jobMatch.findMany({
        orderBy: { overallScore: 'desc' },
        take: 3,
        include: { candidate: true },
      })
    ]);

    const topCandidates = topCandidatesRaw.map((match) => ({
      ...match.candidate,
      matches: [match]
    }));

    return NextResponse.json({
      uploaded,
      resumeParsed,
      githubAnalysed,
      eligible,
      assessmentPassed,
      interviewReady,
      recentActivities,
      topCandidates
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
