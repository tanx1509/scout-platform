import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, UploadCloud, Loader2, FileCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function AgentActions({ candidateId, jobId, matchStatus }: { candidateId: string, jobId: string, matchStatus: string }) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const dispatchEvent = async (type: string, payload: any = {}) => {
    setLoadingAction(type);
    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, candidateId, jobId, payload }),
      });
      if (res.ok) {
        toast.success(`Event ${type} dispatched successfully.`);
        // Note: Realistically, you'd trigger a router.refresh() here 
        // to update the UI with new feed data, or use a websocket.
        window.location.reload();
      } else {
        toast.error("Failed to dispatch event.");
      }
    } catch (e) {
      toast.error("An error occurred.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleUploadAssessment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate reading file and passing to Assessment Agent
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      await dispatchEvent("ASSESSMENT_UPLOADED", {
        fileUrl: file.name,
        type: file.type || "text/plain",
        rawContent: content
      });
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-6 pt-4 border-t">
      <div className="text-sm font-medium text-muted-foreground mr-2">Orchestrate:</div>
      
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        disabled={loadingAction !== null || matchStatus === "APPLIED"}
        onClick={() => dispatchEvent("OUTREACH_REQUESTED")}
      >
        {loadingAction === "OUTREACH_REQUESTED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        Assign to Outreach Agent
      </Button>

      <Dialog>
        <Button variant="outline" size="sm" className="gap-2" render={<DialogTrigger />}>
          <UploadCloud className="h-4 w-4" />
          Upload Assessment
        </Button>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Upload Candidate Assessment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="assessment">Assessment File (.py, .js, .txt, .md)</Label>
              <Input 
                id="assessment" 
                type="file" 
                accept=".py,.js,.ts,.txt,.md,.json"
                onChange={handleUploadAssessment} 
                disabled={loadingAction === "ASSESSMENT_UPLOADED"}
              />
            </div>
            {loadingAction === "ASSESSMENT_UPLOADED" && (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Assessment Agent is running...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        disabled={loadingAction !== null || matchStatus === "APPLIED"}
        onClick={() => dispatchEvent("INTERVIEW_REQUESTED")}
      >
        {loadingAction === "INTERVIEW_REQUESTED" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
        Assign to Interview Agent
      </Button>
    </div>
  );
}
