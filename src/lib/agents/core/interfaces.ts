export interface AgentEvent {
  id: string;
  type: string;
  payload: any;
  jobId: string;
  candidateId: string;
  timestamp: number;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: any;
}

export interface Tool {
  name: string;
  execute(input: any): Promise<ToolResult>;
}

export interface AgentContext {
  candidate: any;
  job: any;
  recruiter?: any;
  event: AgentEvent;
  tools: Record<string, Tool>;
  previousActivities: any[];
}

export interface AgentResult {
  success: boolean;
  confidence: number;
  reasoning: string[];
  toolsUsed: string[];
  executionTimeMs: number;
  output: any;
  nextEvent?: AgentEvent;
  requiresHumanReview: boolean;
}

export interface Agent {
  name: string;
  canHandle(event: AgentEvent): boolean;
  execute(context: AgentContext): Promise<AgentResult>;
}
