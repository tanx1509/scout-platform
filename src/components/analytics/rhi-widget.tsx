import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HeartPulse, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RhiWidget({ data }: { data: any }) {
  if (!data) return null;

  return (
    <Card className="h-full border-t-4 border-t-emerald-500 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-emerald-600 dark:text-emerald-400">
          <HeartPulse className="h-5 w-5" />
          Recruitment Health Index (RHI)
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-muted-foreground ml-1" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-64 text-xs">A unified index aggregating internal conversion rates, pipeline velocity, and candidate quality across the organization.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 mb-6">
          <span className="text-5xl font-black text-emerald-500">{data.score}</span>
          <span className="text-xl font-bold text-muted-foreground mb-1">/ 100</span>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span>Assessment Quality</span>
              <span>{data.breakdown.assessmentQuality}</span>
            </div>
            <Progress value={data.breakdown.assessmentQuality} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span>Interview Efficiency</span>
              <span>{data.breakdown.interviewEfficiency}</span>
            </div>
            <Progress value={data.breakdown.interviewEfficiency} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span>Offer Acceptance</span>
              <span>{data.breakdown.offerAcceptance}</span>
            </div>
            <Progress value={data.breakdown.offerAcceptance} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span>Pipeline Velocity</span>
              <span>{data.breakdown.pipelineVelocity}</span>
            </div>
            <Progress value={data.breakdown.pipelineVelocity} className="h-1.5" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1 font-medium">
              <span>Candidate Quality</span>
              <span>{data.breakdown.candidateQuality}</span>
            </div>
            <Progress value={data.breakdown.candidateQuality} className="h-1.5" />
          </div>
        </div>

        <div className="mt-6 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-md border border-emerald-100 dark:border-emerald-900">
          <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider mb-1">AI Recommendation</div>
          <div className="text-sm text-emerald-700 dark:text-emerald-300">
            {data.recommendation}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
