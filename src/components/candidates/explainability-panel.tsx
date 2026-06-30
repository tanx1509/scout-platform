import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { CheckCircle2, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ReactNode } from "react";

function TimelineItem({ title, score, children, icon, colorClass, max = 100 }: { title: string, score: number, children: ReactNode, icon?: ReactNode, colorClass?: string, max?: number }) {
  if (score === 0 && !children) return null;
  return (
    <div className="relative pl-8 pb-8 border-l-2 border-border/50 last:border-l-transparent last:pb-0">
      <div className={`absolute -left-[11px] top-0 h-5 w-5 rounded-full flex items-center justify-center border-2 bg-background ${colorClass ? colorClass.split(' ')[0].replace('text-', 'border-') + ' ' + colorClass.split(' ')[0] : 'border-primary/50 text-primary'}`}>
        {icon || <Info className="h-3 w-3" />}
      </div>
      <div className="space-y-3 -mt-1.5">
        <div className="flex justify-between items-center">
          <h4 className="font-semibold">{title}</h4>
          <span className={`font-bold ${colorClass ? colorClass.split(' ')[0] : 'text-primary'}`}>{score}{max === 100 ? '' : ''}</span>
        </div>
        <Progress value={max === 100 ? score : (score/max)*100} className="h-1.5 bg-muted/50" />
        <ul className="space-y-2 text-sm text-muted-foreground mt-3">
          {children}
        </ul>
      </div>
    </div>
  );
}

export function ExplainabilityPanel({ match, children, defaultOpen = false }: { match: any, children: ReactNode, defaultOpen?: boolean }) {
  if (!match) return <>{children}</>;

  const {
    technicalScore,
    projectScore,
    researchScore,
    resumeScore,
    assessmentScore,
    githubScore,
    communicationScore,
    educationScore,
    jdAlignmentScore,
    riskPenalty,
    overallScore,
    evidence,
    risks,
  } = match;

  let ev: any = {};
  try {
    const rawEv = typeof evidence === 'string' ? JSON.parse(evidence) : (evidence || {});
    
    // Handle the fallback array format: [{ component: "Education", fact: "..." }]
    if (Array.isArray(rawEv)) {
      ev = { technical: [], projects: [], assessment: [], github: [], research: [] };
      rawEv.forEach((item: any) => {
        if (typeof item === 'string') {
          ev.technical.push(item);
        } else if (item?.component && item?.fact) {
          const comp = item.component.toLowerCase();
          if (comp.includes('test') || comp.includes('assess')) ev.assessment.push(item.fact);
          else if (comp.includes('proj')) ev.projects.push(item.fact);
          else if (comp.includes('git')) ev.github.push(item.fact);
          else if (comp.includes('research')) ev.research.push(item.fact);
          else ev.technical.push(`${item.component}: ${item.fact}`); // Fallback for Education, etc.
        }
      });
    } else {
      ev = rawEv;
    }
  } catch {
    ev = {};
  }

  const renderEvidence = (items: any) => {
    if (!items || !Array.isArray(items) || items.length === 0) return <li className="text-zinc-400 italic text-sm">No specific evidence recorded.</li>;
    return items.map((item: string, i: number) => (
      <li key={i} className="flex items-start gap-2">
        <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
        <span className="text-sm">{item}</span>
      </li>
    ));
  };

    // Recalculate exactly to guarantee UI math matches 
    const tScore = technicalScore || 0;
    const pScore = projectScore || 0;
    const aScore = assessmentScore || 0;
    const gScore = githubScore || 0;
    const rScore = researchScore || 0;
    const penalty = riskPenalty || 0;
    
    let calculatedScore = (tScore * 0.35) + (pScore * 0.20) + (rScore * 0.10) + (gScore * 0.15) + (aScore * 0.20) - penalty;
    calculatedScore = Math.max(0, Math.min(100, calculatedScore));

    return (
      <Sheet defaultOpen={defaultOpen}>
        <SheetTrigger render={children as React.ReactElement} />
        <SheetContent className="w-[450px] sm:w-[540px] sm:max-w-none overflow-y-auto pr-8">
          <SheetHeader className="mb-6">
            <SheetTitle>Explainability Engine</SheetTitle>
            <SheetDescription>
              Transparent breakdown of how the AI computed this candidate&apos;s score.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-0 ml-4 mt-4 mr-2">
            
            <TimelineItem title="Technical Match (35%)" score={Math.round(tScore)} colorClass="text-blue-500 bg-blue-500/10 border-blue-500/20">
              {renderEvidence(ev.technical)}
            </TimelineItem>

            <TimelineItem title="Projects Portfolio (20%)" score={Math.round(pScore)} colorClass="text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
              {renderEvidence(ev.projects)}
            </TimelineItem>

            <TimelineItem title="Assessments (20%)" score={Math.round(aScore)} colorClass="text-amber-500 bg-amber-500/10 border-amber-500/20">
              {aScore === 0 ? <li className="text-amber-500/70 italic">Pending Assessment</li> : renderEvidence(ev.assessment)}
            </TimelineItem>

            <TimelineItem title="GitHub Strength (15%)" score={Math.round(gScore)} colorClass="text-slate-400 bg-slate-500/10 border-slate-500/20">
               {gScore === 0 ? <li className="text-slate-500 italic">Not Provided</li> : renderEvidence(ev.github)}
            </TimelineItem>

            <TimelineItem title="Research & Academics (10%)" score={Math.round(rScore)} colorClass="text-indigo-400 bg-indigo-500/10 border-indigo-500/20">
              {renderEvidence(ev.research)}
            </TimelineItem>

            {penalty > 0 && (
              <TimelineItem 
                title="Risk Penalty" 
                score={-Math.round(penalty)} 
                icon={<AlertTriangle className="h-3 w-3" />}
                colorClass="text-red-500 bg-red-500/10 border-red-500/20"
              >
                {risks?.map((risk: any, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{risk.reason}</span>
                  </li>
                ))}
              </TimelineItem>
            )}

            <div className="relative pl-8 pt-4 pb-4 border-l-2 border-transparent">
              <div className="absolute -left-[11px] top-4 h-5 w-5 rounded-full flex items-center justify-center border-2 border-primary bg-background text-primary">
                <CheckCircle2 className="h-3 w-3" />
              </div>
              <div className="flex justify-between items-center text-lg">
                <h4 className="font-bold">Final Computed Score</h4>
                <span className="font-black text-primary">{Math.round(calculatedScore)}</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
}
