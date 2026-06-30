import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: { ids?: string }
}) {
  const ids = searchParams?.ids?.split(",") || [];
  
  if (ids.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-xl font-bold">Select at least 2 candidates to compare.</h2>
        <Button render={<Link href="/candidates" />}>
          Go to Candidates
        </Button>
      </div>
    );
  }

  const candidates = await prisma.candidate.findMany({
    where: { id: { in: ids } },
    include: { matches: true, assessments: true }
  });

  // Sort candidates by overall score descending
  const sorted = candidates.sort((a, b) => {
    const scoreA = a.matches?.[0]?.overallScore || 0;
    const scoreB = b.matches?.[0]?.overallScore || 0;
    return scoreB - scoreA;
  });

  const medals = ["🥇 Best Overall", "🥈 Strong Alternative", "🥉 Needs Review"];

  const getWinnerDeltaText = (winner: any, runnerUp: any) => {
    if (!winner || !runnerUp) return null;
    const m1 = winner.matches[0];
    const m2 = runnerUp.matches[0];
    if (!m1 || !m2) return null;

    const deltas = [];
    if (m1.technicalScore - m2.technicalScore > 2) deltas.push(`+${Math.round(m1.technicalScore - m2.technicalScore)} Technical`);
    if (m1.assessmentScore - m2.assessmentScore > 2) deltas.push(`+${Math.round(m1.assessmentScore - m2.assessmentScore)} Assessment`);
    if (m1.githubScore - m2.githubScore > 2) deltas.push(`+${Math.round(m1.githubScore - m2.githubScore)} GitHub`);
    if (m1.projectScore - m2.projectScore > 2) deltas.push(`+${Math.round(m1.projectScore - m2.projectScore)} Projects`);
    
    // Check if runner up won something
    if (m2.communicationScore - m1.communicationScore > 2) deltas.push(`-${Math.round(m2.communicationScore - m1.communicationScore)} Communication`);

    return (
      <div className="space-y-1">
        {deltas.map((d, i) => (
          <div key={i} className={`text-sm font-semibold ${d.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>
            {d}
          </div>
        ))}
        <div className="text-sm font-black mt-2 pt-2 border-t border-border/50 text-primary">
          Overall +{Math.round(m1.overallScore - m2.overallScore)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" render={<Link href="/candidates" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Candidate Comparison</h1>
            <p className="text-sm text-muted-foreground mt-1">Side-by-side analysis of your selected candidates.</p>
          </div>
        </div>
      </div>

      {/* Comparison Reasoning */}
      {sorted.length >= 2 && (
        <Card className="border-2 border-primary/20 bg-primary/5 shadow-md">
          <CardContent className="p-6">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Why {sorted[0].name.split(" ")[0]} outranks {sorted[1].name.split(" ")[0]}
            </h2>
            <div className="bg-background/80 rounded-lg p-4 max-w-sm border border-border shadow-sm">
              {getWinnerDeltaText(sorted[0], sorted[1])}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Visual First Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((candidate, i) => {
          const match = candidate.matches?.[0];
          const score = match?.overallScore || 0;
          return (
            <Card key={candidate.id} className={`border-2 ${i === 0 ? 'border-primary shadow-lg ring-1 ring-primary/20 scale-[1.02]' : 'border-border/50'}`}>
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{candidate.name}</h3>
                    <div className="text-sm text-muted-foreground">{candidate.email}</div>
                  </div>
                  <Badge variant={i === 0 ? "default" : "secondary"} className="text-xs px-2 py-1">
                    {medals[i] || `${i + 1}th Place`}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-1 font-bold">
                    <span>Overall Match</span>
                    <span>{Math.round(score)}%</span>
                  </div>
                  <Progress value={score} className="h-3" />
                </div>
                
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Technical</span>
                    <span className="font-semibold">{Math.round(match?.technicalScore || 0)}</span>
                  </div>
                  <Progress value={match?.technicalScore || 0} className="h-1.5 bg-blue-100 [&>div]:bg-blue-600" />
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Projects</span>
                    <span className="font-semibold">{Math.round(match?.projectScore || 0)}</span>
                  </div>
                  <Progress value={match?.projectScore || 0} className="h-1.5 bg-emerald-100 [&>div]:bg-emerald-600" />

                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">GitHub</span>
                    <span className="font-semibold">{Math.round(match?.githubScore || 0)}</span>
                  </div>
                  <Progress value={match?.githubScore || 0} className="h-1.5 bg-slate-200 [&>div]:bg-slate-700" />
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Assessment</span>
                    <span className="font-semibold">{Math.round(match?.assessmentScore || 0)}</span>
                  </div>
                  <Progress value={match?.assessmentScore || 0} className="h-1.5 bg-purple-100 [&>div]:bg-purple-600" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Table Matrix Second */}
      <div className="rounded-xl border border-border/50 overflow-hidden bg-card mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Metric</th>
                {sorted.map(c => <th key={c.id} className="px-6 py-4">{c.name.split(" ")[0]}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr className="hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">Recommendation</td>
                {sorted.map(c => <td key={c.id} className="px-6 py-4 font-bold">{c.matches?.[0]?.recommendation?.replace(/_/g, ' ')}</td>)}
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">Risk Penalty</td>
                {sorted.map(c => {
                  const riskPenalty = c.matches?.[0]?.riskPenalty || 0;
                  return (
                    <td key={c.id} className="px-6 py-4">
                      {riskPenalty > 0 ? (
                        <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> -{Math.round(riskPenalty)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
              <tr className="hover:bg-muted/30">
                <td className="px-6 py-4 font-medium">Top Strength</td>
                {sorted.map(c => {
                  const m = c.matches?.[0];
                  let top = "None";
                  if (m) {
                    const scores = { "Technical": m.technicalScore, "Projects": m.projectScore, "GitHub": m.githubScore, "Assessment": m.assessmentScore };
                    top = Object.entries(scores).sort((a,b)=>Number(b[1])-Number(a[1]))[0][0];
                  }
                  return <td key={c.id} className="px-6 py-4 text-green-600 font-semibold">{top}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
}
