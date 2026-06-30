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

    // Trigger pipeline asynchronously (don't block the request)
    // We process them one by one or concurrently depending on API rate limits.
    // For this demo, we'll fire them concurrently since it's an assignment.
    const promises = candidates.map(async (candidate) => {
      const jobId = candidate.matches[0]?.jobId;
        if (!jobId) return;
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
      if (!jobId) return;

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
    });

    // We don't await all promises here to prevent Vercel timeout on 10+ calls.
    // However, Node.js background promises might get killed on serverless.
    // For demo purposes, we will await them, but in production we'd use a queue (Inngest, Quirrel, etc).
    await Promise.allSettled(promises);

    return NextResponse.json({ success: true, message: `Triggered intelligence for ${triggeredCount} candidates.` });
  } catch (error) {
    console.error("Batch Orchestrator API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
