import { requireAuth } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";
import { WorkflowCoordinator } from "@/lib/agents/core/coordinator";
import { AgentEvent } from "@/lib/agents/core/interfaces";

export async function POST(req: NextRequest) {
  await requireAuth();

  try {
    const body = await req.json();
    
    if (!body.type || !body.candidateId || !body.jobId) {
      return NextResponse.json({ error: "Missing required event fields" }, { status: 400 });
    }

    const event: AgentEvent = {
      id: crypto.randomUUID(),
      type: body.type,
      payload: body.payload || {},
      candidateId: body.candidateId,
      jobId: body.jobId,
      timestamp: Date.now()
    };

    // Dispatch the event synchronously within this request
    await WorkflowCoordinator.dispatch(event);

    return NextResponse.json({ success: true, message: `Event ${event.type} dispatched.` });
  } catch (error) {
    console.error("Orchestrator API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
