import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAuth();

  try {
    const resolvedParams = await params;
    const job = await prisma.job.findUnique({
      where: { id: resolvedParams.id },
      include: {
        matches: {
          include: {
            candidate: {
              include: { profile: true }
            }
          },
          orderBy: { overallScore: "desc" }
        },
        analysis: true
      }
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to fetch job:", error);
    return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
  }
}
