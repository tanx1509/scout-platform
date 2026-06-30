import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Network, Clock, Wrench, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export function AgentTraceModal({ activity }: { activity: any }) {
  const toolsUsed = Array.isArray(activity.toolsUsed) ? activity.toolsUsed : [];
  // For demo trace simulation, we fake the tool timings based on the executionTimeMs
  const stepTime = Math.floor(activity.executionTimeMs / (toolsUsed.length + 2));

  return (
    <Dialog>
      <Button variant="outline" size="sm" className="w-full text-xs gap-2" render={<DialogTrigger />}>
        <Network className="h-3 w-3" />
        View Agent Reasoning
      </Button>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Agent Execution Trace
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-sm space-y-4 overflow-y-auto max-h-[60vh]">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Agent:</span>
            <span className="text-emerald-400">{activity.agentName}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Event Triggered:</span>
            <span className="text-blue-400">{activity.event}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400">Total Execution Time:</span>
            <span className="text-amber-400">{activity.executionTimeMs}ms</span>
          </div>

          <div className="pt-2">
            <div className="text-slate-400 mb-2">Execution Timeline:</div>
            
            <div className="space-y-3 pl-2 border-l-2 border-slate-800">
              <div className="relative pl-4">
                <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-slate-600"></span>
                <span className="text-xs text-slate-500 mr-2">{format(new Date(activity.timestamp), 'HH:mm:ss')}</span>
                <span className="text-slate-300">Coordinator received {activity.event}</span>
              </div>
              
              <div className="relative pl-4">
                <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-slate-600"></span>
                <span className="text-xs text-slate-500 mr-2">{format(new Date(new Date(activity.timestamp).getTime() + 10), 'HH:mm:ss')}</span>
                <span className="text-blue-300">{activity.agentName} selected from Registry</span>
              </div>

              {toolsUsed.map((tool: string, idx: number) => (
                <div key={idx} className="relative pl-4">
                  <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-amber-500"></span>
                  <span className="text-xs text-slate-500 mr-2">{format(new Date(new Date(activity.timestamp).getTime() + 20 + (idx * stepTime)), 'HH:mm:ss')}</span>
                  <span className="text-amber-300 flex items-center gap-2 inline-flex">
                    <Wrench className="h-3 w-3" />
                    {tool} executed
                  </span>
                </div>
              ))}

              <div className="relative pl-4">
                <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs text-slate-500 mr-2">{format(new Date(new Date(activity.timestamp).getTime() + activity.executionTimeMs), 'HH:mm:ss')}</span>
                <span className="text-emerald-300 flex items-center gap-2 inline-flex">
                  <CheckCircle2 className="h-3 w-3" />
                  Agent execution completed
                </span>
              </div>
            </div>
          </div>

          {activity.output && (
            <div className="pt-4 border-t border-slate-800">
              <div className="text-slate-400 mb-2">Agent Output:</div>
              <pre className="bg-slate-900 p-3 rounded text-xs text-green-300 overflow-x-auto">
                {JSON.stringify(activity.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
