import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { MatchStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
  } catch (e) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { status, action } = await req.json();

    if (!status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    // Since we don't have a rigid job context in the current UI, we apply it to the first JobMatch.
    // In a fully featured ATS, this would take the jobId from the UI.
    const candidate = await prisma.candidate.findUnique({
      where: { id: resolvedParams.id },
      include: { matches: { orderBy: { createdAt: "desc" }, take: 1 } },
    });

    if (!candidate || candidate.matches.length === 0) {
      return NextResponse.json({ error: "Candidate match not found" }, { status: 404 });
    }

    const matchId = candidate.matches[0].id;

    // Update status
    const updatedMatch = await prisma.jobMatch.update({
      where: { id: matchId },
      data: { status: status as MatchStatus },
    });

    // Log Activity
    await prisma.agentActivity.create({
      data: {
        candidateId: resolvedParams.id,
        agentName: "Recruiter Action",
        event: action || `Status updated to ${status}`,
        executionTimeMs: 0,
      },
    });

    const { revalidatePath } = require("next/cache");
    revalidatePath("/", "layout");

    return NextResponse.json({ success: true, match: updatedMatch }, { status: 200 });
  } catch (error) {
    console.error("Status Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
