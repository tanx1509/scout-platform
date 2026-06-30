import { Agent, AgentEvent } from "./interfaces";
import { AssessmentAgent } from "../implementations/assessment";
import { OutreachAgent } from "../implementations/outreach";
import { InterviewAgent } from "../implementations/interview";
import { GithubAgent } from "../implementations/github";
import { ResumeAgent } from "../implementations/resume";
import { EvaluatorAgent } from "../implementations/evaluator";

export class AgentRegistry {
  private agents: Agent[] = [];

  constructor() {
    this.agents.push(new AssessmentAgent());
    this.agents.push(new OutreachAgent());
    this.agents.push(new InterviewAgent());
    this.agents.push(new GithubAgent());
    this.agents.push(new ResumeAgent());
    this.agents.push(new EvaluatorAgent());
  }

  register(agent: Agent) {
    this.agents.push(agent);
  }

  find(event: AgentEvent): Agent | null {
    return this.agents.find(a => a.canHandle(event)) || null;
  }
}

// Export a singleton instance
export const registry = new AgentRegistry();
