import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Target, CalendarDays, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MonthlySummary({ data }: { data: any }) {
  if (!data) return null;

  return (
    <Card className="h-full shadow-md">
      <CardHeader className="border-b bg-muted/10 pb-4">
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Monthly Executive Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/20 border flex flex-col items-center text-center">
            <Users className="h-5 w-5 text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{data.totalApplicants}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Applicants</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border flex flex-col items-center text-center">
            <Target className="h-5 w-5 text-emerald-500 mb-2" />
            <div className="text-2xl font-bold">{data.hired}</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Hires</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border flex flex-col items-center text-center">
            <Clock className="h-5 w-5 text-amber-500 mb-2" />
            <div className="text-2xl font-bold">{data.avgTimeToHire}<span className="text-sm font-normal ml-1">days</span></div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Time to Hire</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/20 border flex flex-col items-center text-center">
            <Bot className="h-5 w-5 text-purple-500 mb-2" />
            <div className="text-2xl font-bold">{data.interviewConversion}%</div>
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Interview Conv.</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 blur-xl opacity-50 rounded-xl"></div>
          <div className="relative p-5 rounded-lg border bg-background/80 backdrop-blur-sm shadow-sm">
            <h4 className="flex items-center gap-2 font-medium mb-3 text-primary">
              <Bot className="h-4 w-4" />
              AI Hiring Narrative
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {data.prose}
            </p>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <Badge variant="outline" className="text-xs font-mono">Sources: Internal Activity Logs, Pipeline Telemetry</Badge>
              <Badge variant="default" className="text-xs">Confidence: High</Badge>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
