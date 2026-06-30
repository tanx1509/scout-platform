import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, BrainCircuit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComparisonModal({ candidates, matches, jobId }: { candidates: any[], matches: any[], jobId: string }) {
  const [verdict, setVerdict] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (candidates.length < 2) return null;

  const handleGenerateVerdict = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/match/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          candidateIds: candidates.slice(0, 3).map(c => c.id)
        })
      });
      if (res.ok) {
        setVerdict(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Compare Candidates</Button>} />
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidate Comparison</DialogTitle>
        </DialogHeader>

        {!verdict && !loading && (
          <div className="flex justify-end mb-4">
            <Button onClick={handleGenerateVerdict} className="gap-2">
              <BrainCircuit className="h-4 w-4" />
              Generate AI Verdict
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex justify-center p-6 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            AI is analyzing the candidates...
          </div>
        )}

        {verdict && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-primary">
                <BrainCircuit className="h-5 w-5" />
                AI Verdict
              </h3>
              <p className="text-sm font-medium mb-4 leading-relaxed">
                {verdict.verdict}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {candidates.slice(0, 3).map(c => {
                  const comp = verdict.comparisons?.[c.id];
                  if (!comp) return null;
                  const isRecommended = verdict.recommendedCandidateId === c.id;
                  
                  return (
                    <div key={c.id} className={`p-3 rounded-md border ${isRecommended ? 'border-primary bg-primary/10' : 'bg-background'}`}>
                      <div className="font-semibold text-sm mb-2">{c.name} {isRecommended && "⭐"}</div>
                      <div className="text-xs space-y-1 mb-2">
                        <div className="text-green-600 dark:text-green-400 font-medium">Pros:</div>
                        <ul className="list-disc pl-4 text-muted-foreground">
                          {comp.pros?.map((p:string, i:number) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                      <div className="text-xs space-y-1">
                        <div className="text-amber-600 dark:text-amber-400 font-medium">Cons:</div>
                        <ul className="list-disc pl-4 text-muted-foreground">
                          {comp.cons?.map((p:string, i:number) => <li key={i}>{p}</li>)}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="font-semibold text-muted-foreground pt-4">Metric</div>
          {candidates.slice(0,3).map(c => <div key={c.id} className="font-bold text-lg">{c.name}</div>)}
          
          <div className="font-semibold text-muted-foreground pt-4 col-span-4 border-b">Overall Fit</div>
          <div className="font-medium">Recommendation</div>
          {candidates.slice(0,3).map(c => {
            const m = matches.find(x => x.candidateId === c.id);
            return <div key={c.id}>{m ? m.recommendation.replace("_", " ") : "N/A"}</div>
          })}
          
          <div className="font-medium">Match Score</div>
          {candidates.slice(0,3).map(c => {
            const m = matches.find(x => x.candidateId === c.id);
            return <div key={c.id}>{m ? `${m.overallScore.toFixed(0)}%` : "N/A"}</div>
          })}

          <div className="font-semibold text-muted-foreground pt-4 col-span-4 border-b">Sub-Scores</div>
          <div className="font-medium">Technical</div>
          {candidates.slice(0,3).map(c => {
            const m = matches.find(x => x.candidateId === c.id);
            return <div key={c.id}><Progress value={m?.technicalScore || 0} className="h-2 mt-2" /></div>
          })}

          <div className="font-medium">Experience</div>
          {candidates.slice(0,3).map(c => {
            const m = matches.find(x => x.candidateId === c.id);
            return <div key={c.id}><Progress value={m?.experienceScore || 0} className="h-2 mt-2" /></div>
          })}
          
          <div className="font-medium">Education</div>
          {candidates.slice(0,3).map(c => {
            const m = matches.find(x => x.candidateId === c.id);
            return <div key={c.id}><Progress value={m?.educationScore || 0} className="h-2 mt-2" /></div>
          })}
          
          <div className="font-medium">GitHub</div>
          {candidates.slice(0,3).map(c => {
            const m = matches.find(x => x.candidateId === c.id);
            return <div key={c.id}><Progress value={m?.githubScore || 0} className="h-2 mt-2" /></div>
          })}

        </div>
      </DialogContent>
    </Dialog>
  );
}
