import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await requireAuth();

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '1000', 10); // increased limit to support global client search
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [candidates, total] = await Promise.all([
      prisma.candidate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          resume: {
            select: {
              id: true,
              status: true,
              parsingConfidence: true,
              errorMessage: true,
            }
          },
          matches: {
            select: {
              status: true,
              overallScore: true,
              technicalScore: true,
              projectScore: true,
              educationScore: true,
              githubScore: true,
              assessmentScore: true,
              jdAlignmentScore: true,
              researchScore: true,
              confidence: true,
              fallbackUsed: true,
              recommendation: true,
              summary: true,
              evidence: true,
              risks: true,
              interviewFocus: true,
            }
          },
          githubCache: {
            select: {
              id: true
            }
          },
          assessments: {
            select: {
              logicalScore: true,
              codingScore: true,
              status: true,
            }
          }
        }
      }),
      prisma.candidate.count({ where }),
    ]);

    return NextResponse.json({
      candidates,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}
