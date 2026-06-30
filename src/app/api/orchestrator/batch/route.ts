import { requireAuth } from "@/lib/auth/session";
import { NextResponse } from "next/server";
import prisma from "@/lib/db/prisma";
import { WorkflowCoordinator } from "@/lib/agents/core/coordinator";
import { AgentEvent } from "@/lib/agents/core/interfaces";

export async function POST() {
  await requireAuth();

  try {
    // Find all candidates where a JobMatch is APPLIED
    const candidates = await prisma.candidate.findMany({
      where: {
        matches: { some: { status: "APPLIED" } }
      },
      include: {
        matches: { 
          where: { status: "APPLIED" },
          select: { jobId: true } 
        }
      }
    });

    if (candidates.length === 0) {
      return NextResponse.json({ success: true, message: "No candidates pending intelligence." });
    }

    let triggeredCount = 0;

    // Process them sequentially with a delay to respect AI provider rate limits
    for (const candidate of candidates) {
      const jobId = candidate.matches[0]?.jobId;
      if (!jobId) continue;

      // First, request GitHub analysis
      const githubEvent: AgentEvent = {
        id: crypto.randomUUID(),
        type: "GITHUB_ANALYSIS_REQUESTED",
        payload: { trigger: "batch_run" },
        candidateId: candidate.id,
        jobId: jobId,
        timestamp: Date.now()
      };
      try {
        await WorkflowCoordinator.dispatch(githubEvent);
      } catch (err) {
        console.error(`GitHub analysis failed for candidate ${candidate.id}`, err);
      }

      // Also trigger resume parsing so it doesn't stay PENDING forever
      const resumeEvent: AgentEvent = {
        id: crypto.randomUUID(),
        type: "RESUME_UPLOADED",
        payload: { trigger: "batch_run" },
        candidateId: candidate.id,
        jobId: jobId,
        timestamp: Date.now()
      };
      try {
        await WorkflowCoordinator.dispatch(resumeEvent);
      } catch (err) {
        console.error(`Resume parsing failed for candidate ${candidate.id}`, err);
      }

      const event: AgentEvent = {
        id: crypto.randomUUID(),
        type: "EVALUATION_REQUESTED",
        payload: { trigger: "batch_run" },
        candidateId: candidate.id,
        jobId: jobId,
        timestamp: Date.now()
      };

      try {
        await WorkflowCoordinator.dispatch(event);
        triggeredCount++;
      } catch (err) {
        console.error(`Failed to trigger intelligence for candidate ${candidate.id}`, err);
      }
      
      // Wait 3 seconds between candidates to avoid rate limits on free AI tiers
      await new Promise(r => setTimeout(r, 3000));
    }

    return NextResponse.json({ success: true, message: `Triggered intelligence for ${triggeredCount} candidates.` });
  } catch (error) {
    console.error("Batch Orchestrator API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
