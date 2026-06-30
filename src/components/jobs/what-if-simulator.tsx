import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, SlidersHorizontal, Users, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WhatIfSimulator({ jobId, initialMatches }: { jobId: string; initialMatches: number }) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  
  // Controls
  const [experience, setExperience] = useState([5]);
  const [dropSkill, setDropSkill] = useState(false);
  const [remoteOnly, setRemoteOnly] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: {
            experience: experience[0],
            dropSkill,
            remoteOnly
          }
        }),
      });
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-t-4 border-t-amber-500 shadow-sm mt-6">
      <CardHeader className="pb-4 border-b bg-muted/10">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <SlidersHorizontal className="h-5 w-5" />
            What-If Simulator
          </div>
          <Button size="sm" onClick={handleSimulate} disabled={loading} variant="secondary" className="gap-2">
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            Simulate Impact
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Adjust Requirements</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <Label>Minimum Experience (Years)</Label>
              <span className="text-sm font-mono">{experience[0]} YOE</span>
            </div>
            <Slider 
              value={experience} 
              onValueChange={(val: any) => setExperience(val as number[])}
              max={10} 
              step={1} 
              className="py-2"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Drop Top Rare Skill</Label>
              <p className="text-xs text-muted-foreground">e.g., Make Kubernetes Preferred instead of Required</p>
            </div>
            <Switch checked={dropSkill} onCheckedChange={setDropSkill} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Remote Only</Label>
              <p className="text-xs text-muted-foreground">Restrict pool to remote-eligible candidates</p>
            </div>
            <Switch checked={remoteOnly} onCheckedChange={setRemoteOnly} />
          </div>
        </div>

        <div className="bg-muted/20 p-5 rounded-lg border">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex justify-between items-center">
            Simulated Impact
            <Badge variant="outline" className="font-mono text-xs font-normal">Internal Data Only</Badge>
          </h4>
          
          {results ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-card rounded shadow-sm border">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="h-3 w-3"/> Eligible Candidates</div>
                  <div className="text-2xl font-bold flex items-end gap-2">
                    {results.eligibleCandidates}
                    {results.candidateDelta !== 0 && (
                      <span className={`text-sm mb-1 ${results.candidateDelta > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {results.candidateDelta > 0 ? '+' : ''}{results.candidateDelta}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="p-3 bg-card rounded shadow-sm border">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Activity className="h-3 w-3"/> Avg Match Impact</div>
                  <div className={`text-2xl font-bold flex items-center gap-2 ${results.averageMatchImpact > 0 ? 'text-green-500' : results.averageMatchImpact < 0 ? 'text-red-500' : ''}`}>
                    {results.averageMatchImpact > 0 ? '+' : ''}{results.averageMatchImpact}%
                    {results.averageMatchImpact > 0 ? <TrendingUp className="h-4 w-4" /> : results.averageMatchImpact < 0 ? <TrendingDown className="h-4 w-4" /> : null}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm p-3 bg-amber-50 dark:bg-amber-950/20 rounded border border-amber-100 dark:border-amber-900">
                <span className="font-medium text-amber-800 dark:text-amber-200">Estimated Interview Volume</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{results.estimatedInterviewVolume} interviews/week</span>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground py-10 opacity-60">
              <SlidersHorizontal className="h-8 w-8 mb-3" />
              <p className="text-sm">Adjust parameters and run simulation to see impact on your current talent pool.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
