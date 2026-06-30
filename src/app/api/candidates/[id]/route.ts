import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const candidate = await prisma.candidate.findUnique({
      where: { id: resolvedParams.id },
      include: {
        resume: {
          select: {
            id: true,
            status: true,
            parsingConfidence: true,
            sourceUrl: true,
            rawText: true,
            errorMessage: true,
            parsedAt: true,
          }
        },
        profile: true,
        matches: {
          orderBy: { createdAt: "desc" }
        },
        assessments: true,
        interviews: true,
        githubCache: true
      },
    });

    const activities = await prisma.agentActivity.findMany({
      where: { candidateId: resolvedParams.id },
      orderBy: { timestamp: "desc" }
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ ...candidate, activities });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch candidate' }, { status: 500 });
  }
}
