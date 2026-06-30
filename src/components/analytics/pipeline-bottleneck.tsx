import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Filter, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PipelineBottleneck() {
  return (
    <Card className="shadow-sm border-t-4 border-t-rose-500 mt-6">
      <CardHeader className="pb-3 border-b bg-muted/10">
        <CardTitle className="text-lg flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <Filter className="h-5 w-5" />
          Pipeline Bottleneck Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            Current Funnel Drop-offs
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between p-3 bg-muted/20 rounded border">
              <span className="font-medium text-muted-foreground">Applied → Screening</span>
              <span className="font-bold">-12%</span>
            </div>
            <div className="flex justify-between p-3 bg-rose-50 dark:bg-rose-950/20 rounded border border-rose-200 dark:border-rose-900">
              <span className="font-medium text-rose-700 dark:text-rose-300 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Screening → Assessment</span>
              <span className="font-bold text-rose-700 dark:text-rose-300">-61%</span>
            </div>
            <div className="flex justify-between p-3 bg-muted/20 rounded border">
              <span className="font-medium text-muted-foreground">Assessment → Interview</span>
              <span className="font-bold">-24%</span>
            </div>
          </div>
        </div>
        
        <div className="bg-muted/10 p-5 rounded-lg border flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
              AI Diagnostic
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              The highest drop-off is occurring at the Assessment stage (61%). Assessment completion is significantly lower than previous hiring campaigns. Historical internal data shows this typically correlates with assessments taking longer than 60 minutes.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <Badge variant="outline" className="text-xs font-mono">Sources: Historical Campaign Data</Badge>
            <Badge className="text-xs">Confidence: High</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
