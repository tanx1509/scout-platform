import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, MessageSquare, Database, FileText, Code, Award, Globe, FileCode } from "lucide-react";

export function DecisionPanel({ candidate, match }: { candidate: any; match: any }) {
  if (!match) return null;

  const evidence = match.evidence || {};
  const risks = match.risks || [];
  const interviewFocus = match.interviewFocus || {};
  const confidence = match.confidence || 0;

  // Flatten evidence into a list of reasons to hire
  const pros = [
    ...(evidence.technical || []),
    ...(evidence.projects || []),
    ...(evidence.research || []),
    ...(evidence.assessment || []),
    ...(evidence.github || []),
  ].filter(Boolean).slice(0, 5);

  const suggestedQuestions = [
    ...(interviewFocus.technical || []),
    ...(interviewFocus.behavioral || []),
  ].filter(Boolean).slice(0, 4);

  const hasResume = !!candidate.resume?.sourceUrl;
  const hasGithub = !!candidate.githubProfile;
  const hasAssessment = !!(candidate.assessments && candidate.assessments.length > 0);
  const hasResearch = !!candidate.researchWork;
  const hasProject = !!candidate.bestAiProject;

  return (
    <Card className="border-2 border-primary/20 shadow-md bg-gradient-to-br from-background to-primary/5">
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Column: Why & Concerns */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Hire because
            </h3>
            <ul className="space-y-2">
              {pros.length > 0 ? (
                pros.map((pro: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    <span>{pro}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground italic">No strong evidence found.</li>
              )}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              Watch for
            </h3>
            <ul className="space-y-2">
              {risks.length > 0 ? (
                risks.map((risk: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <span>{risk.reason}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground italic">No significant concerns flagged.</li>
              )}
            </ul>
          </div>
        </div>

        {/* Right Column: Interview, Confidence, Data Sources */}
        <div className="space-y-6 border-l border-border pl-0 md:pl-8">
          
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2 text-blue-700">
              <MessageSquare className="h-5 w-5" />
              Suggested Interview
            </h3>
            <ul className="space-y-2">
              {suggestedQuestions.length > 0 ? (
                suggestedQuestions.map((q: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <span>{q}</span>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground italic">No specific questions generated.</li>
              )}
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/50">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recommended Next Action</h3>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 font-bold text-primary">
                <CheckCircle2 className="h-4 w-4" />
                Schedule Technical Interview
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-primary/10">
                <span>Estimated duration: <strong>45 min</strong></span>
                <span>Interviewers: <strong>ML Engineer</strong></span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Confidence</h4>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{confidence}%</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                <Database className="h-3 w-3" />
                Data Sources
              </h4>
              <div className="flex flex-col gap-1 text-xs">
                <span className={`flex items-center gap-1 ${hasResume ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {hasResume ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3" />} Resume
                </span>
                <span className={`flex items-center gap-1 ${hasGithub ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {hasGithub ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3" />} GitHub
                </span>
                <span className={`flex items-center gap-1 ${hasAssessment ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {hasAssessment ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3" />} Assessment
                </span>
                <span className={`flex items-center gap-1 ${hasResearch ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {hasResearch ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3" />} Research
                </span>
                <span className={`flex items-center gap-1 ${hasProject ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {hasProject ? <CheckCircle2 className="h-3 w-3" /> : <div className="w-3" />} AI Project
                </span>
              </div>
            </div>
          </div>
          
        </div>

      </CardContent>
    </Card>
  );
}
