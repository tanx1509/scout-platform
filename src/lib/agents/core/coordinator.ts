import { AgentEvent, AgentContext } from "./interfaces";
import { registry } from "./registry";
import { prisma } from "@/lib/db/prisma";

export class WorkflowCoordinator {
  static async dispatch(event: AgentEvent) {
    console.log(`[Coordinator] Received Event: ${event.type} for Candidate ${event.candidateId}`);

    const agent = registry.find(event);
    
    if (!agent) {
      console.warn(`[Coordinator] No agent found to handle event: ${event.type}`);
      return;
    }

    console.log(`[Coordinator] Selected Agent: ${agent.name}`);

    // Fetch context
    const candidate = await prisma.candidate.findUnique({
      where: { id: event.candidateId },
      include: { profile: true, githubCache: true, resume: { include: { sections: true } } }
    });

    const job = await prisma.job.findUnique({
      where: { id: event.jobId }
    });

    const previousActivities = await prisma.agentActivity.findMany({
      where: { candidateId: event.candidateId, jobId: event.jobId },
      orderBy: { timestamp: 'asc' }
    });

    const context: AgentContext = {
      candidate,
      job,
      event,
      tools: {}, // Agents will initialize their own tools or pull from a ToolRegistry if needed
      previousActivities
    };

    try {
      const result = await agent.execute(context);

      // Log the activity
      await prisma.agentActivity.create({
        data: {
          candidateId: event.candidateId,
          jobId: event.jobId,
          agentName: agent.name,
          event: event.type,
          toolsUsed: result.toolsUsed,
          confidence: result.confidence,
          executionTimeMs: result.executionTimeMs,
          requiresHumanReview: result.requiresHumanReview,
          output: result.output,
          timestamp: new Date()
        }
      });

      console.log(`[Coordinator] Agent ${agent.name} executed successfully. Next Event: ${result.nextEvent?.type || 'None'}`);

      // If there is a next event, dispatch it recursively (or add to a queue)
      if (result.nextEvent) {
        // We dispatch synchronously here for simplicity, but could be async queue
        await WorkflowCoordinator.dispatch(result.nextEvent);
      }
    } catch (error) {
      console.error(`[Coordinator] Agent ${agent.name} failed:`, error);
      
      // Log failure activity
      await prisma.agentActivity.create({
        data: {
          candidateId: event.candidateId,
          jobId: event.jobId,
          agentName: agent.name,
          event: event.type,
          toolsUsed: [],
          executionTimeMs: 0,
          requiresHumanReview: true,
          output: { error: error instanceof Error ? error.message : "Unknown error" },
          timestamp: new Date()
        }
      });
    }
  }
}
