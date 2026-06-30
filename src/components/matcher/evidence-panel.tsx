import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, AlertTriangle, BrainCircuit, Target, Code, BookOpen, GraduationCap, GitBranch } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { FitRadar } from "@/components/candidates/fit-radar";
import { AgentActions } from "@/components/agents/agent-actions";

export function EvidencePanel({ match }: { match: any }) {
  if (!match) return null;

  const isHigh = match.recommendation === "HIGHLY_RECOMMENDED";
  const isMed = match.recommendation === "RECOMMENDED";
  const isLow = match.recommendation === "NOT_RECOMMENDED";

  return (
    <div className="space-y-6">
      <Card className={`border-t-4 ${isHigh ? 'border-t-green-500' : isMed ? 'border-t-amber-500' : 'border-t-destructive'}`}>
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Hiring Decision</CardTitle>
              <CardDescription>AI Audit Trail & Recommendation</CardDescription>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${isHigh ? 'text-green-500' : isMed ? 'text-amber-500' : 'text-destructive'}`}>
                {match.recommendation.replace("_", " ")}
              </div>
              <Badge variant="outline" className="mt-1 font-mono">
                Overall: {match.overallScore?.toFixed(0)}%
              </Badge>
              <Badge variant={match.confidence === 'HIGH' ? 'default' : 'secondary'} className="mt-1 ml-2">
                Confidence: {match.confidence}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          
          <div className="bg-primary/5 p-4 rounded-md border border-primary/10">
            <h4 className="flex items-center justify-between font-medium mb-2 text-primary">
              <span className="flex items-center gap-2"><BrainCircuit className="h-4 w-4" /> AI Summary</span>
              <Badge variant="outline" className="text-xs font-mono">Data Sources: ✓ Resume ✓ GitHub ✓ Assessment ✓ JD</Badge>
            </h4>
            <p className="text-sm leading-relaxed">{match.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="flex items-center gap-2 font-medium mb-3 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Why they match (Reasoning)
              </h4>
              <ul className="space-y-2 text-sm">
                {match.evidence?.why?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="flex items-center gap-2 font-medium mb-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                Risks & Missing Skills
              </h4>
              <ul className="space-y-2 text-sm">
                {match.evidence?.risks?.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-0.5">⚠</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sub-scores & Radar */}
          <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium mb-4">Semantic Sub-Scores</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2"><Code className="h-4 w-4 text-muted-foreground"/> Technical</span>
                    <span className="font-medium">{match.technicalScore?.toFixed(0)}%</span>
                  </div>
                  <Progress value={match.technicalScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2"><Target className="h-4 w-4 text-muted-foreground"/> Experience</span>
                    <span className="font-medium">{match.experienceScore?.toFixed(0)}%</span>
                  </div>
                  <Progress value={match.experienceScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-muted-foreground"/> Projects</span>
                    <span className="font-medium">{match.projectScore?.toFixed(0)}%</span>
                  </div>
                  <Progress value={match.projectScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-muted-foreground"/> Education</span>
                    <span className="font-medium">{match.educationScore?.toFixed(0)}%</span>
                  </div>
                  <Progress value={match.educationScore} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2"><GitBranch className="h-4 w-4 text-muted-foreground"/> GitHub Activity</span>
                    <span className="font-medium">{match.githubScore?.toFixed(0)}%</span>
                  </div>
                  <Progress value={match.githubScore} className="h-2" />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Dynamic Candidate Fit Radar</h4>
              <FitRadar scores={match.radarScores} />
            </div>
          </div>

          {/* Interview Focus Generator */}
          {match.interviewFocus && (
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-4 text-primary">Recommended Interview Focus</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 p-3 rounded-md border">
                  <div className="font-semibold text-sm mb-2 text-primary">Technical</div>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-muted-foreground">
                    {match.interviewFocus.technical?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border">
                  <div className="font-semibold text-sm mb-2 text-primary">Behavioral</div>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-muted-foreground">
                    {match.interviewFocus.behavioral?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
                <div className="bg-muted/30 p-3 rounded-md border">
                  <div className="font-semibold text-sm mb-2 text-primary">Portfolio</div>
                  <ul className="text-xs space-y-1.5 list-disc pl-4 text-muted-foreground">
                    {match.interviewFocus.portfolio?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <AgentActions candidateId={match.candidateId} jobId={match.jobId} matchStatus={match.status} />

        </CardContent>
      </Card>
    </div>
  );
}
