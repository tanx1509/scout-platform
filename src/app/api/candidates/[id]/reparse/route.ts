import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { processResumePipeline } from '@/lib/resume/pipeline';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const candidateId = resolvedParams.id;

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { resume: true }
    });

    if (!candidate || !candidate.resume?.sourceUrl) {
      return NextResponse.json({ error: 'Candidate or resume URL not found' }, { status: 404 });
    }

    // Fire and forget pipeline
    processResumePipeline(candidate.id, candidate.resume.sourceUrl).catch(console.error);

    return NextResponse.json({ success: true, message: 'Reparsing started' });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to start reparsing' }, { status: 500 });
  }
}
