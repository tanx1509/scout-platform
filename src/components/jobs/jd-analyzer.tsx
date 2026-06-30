import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, SearchCode, BookType, AlertCircle, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function JdAnalyzer({ job, onAnalyzed }: { job: any; onAnalyzed: () => void }) {
  const [loading, setLoading] = useState(false);

  const analyzeJd = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/analyze`, { method: "POST" });
      if (res.ok) {
        toast.success("JD Analysis Complete");
        onAnalyzed();
      } else {
        toast.error("Failed to analyze JD");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const analysis = job.analysis;

  return (
    <Card className="border-t-4 border-t-purple-500 shadow-sm mt-6">
      <CardHeader className="pb-4 border-b bg-muted/10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <SearchCode className="h-5 w-5" />
            Hybrid JD Analyzer
          </CardTitle>
          {!analysis && (
            <Button size="sm" onClick={analyzeJd} disabled={loading} variant="secondary">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <SearchCode className="h-4 w-4 mr-2" />}
              Analyze JD
            </Button>
          )}
        </div>
      </CardHeader>
      
      {analysis ? (
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h4 className="flex items-center gap-2 font-medium mb-3 text-sm">
                <BookType className="h-4 w-4 text-blue-500" />
                Deterministic Metrics
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted/30 rounded border">
                  <div className="text-muted-foreground text-xs uppercase">Word Count</div>
                  <div className="font-bold">{analysis.deterministic?.wordCount}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded border">
                  <div className="text-muted-foreground text-xs uppercase">Reading Level</div>
                  <div className="font-bold">{analysis.deterministic?.estimatedReadingLevel}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded border">
                  <div className="text-muted-foreground text-xs uppercase">Requirements</div>
                  <div className="font-bold">{analysis.deterministic?.requirementsCount} skills</div>
                </div>
                <div className="p-3 bg-muted/30 rounded border">
                  <div className="text-muted-foreground text-xs uppercase">Experience</div>
                  <div className="font-bold">{analysis.deterministic?.yearsExperience} years</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="flex items-center gap-2 font-medium mb-3 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                Language & Bias
              </h4>
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded border border-amber-100 dark:border-amber-900 text-sm">
                {analysis.llmReasoning?.inclusiveness || "No major inclusiveness issues detected."}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="flex items-center gap-2 font-medium mb-3 text-sm">
                <SearchCode className="h-4 w-4 text-rose-500" />
                Ambiguous Wording
              </h4>
              <ul className="space-y-2">
                {analysis.llmReasoning?.ambiguity?.map((item: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-rose-500 mt-1">•</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
                {(!analysis.llmReasoning?.ambiguity || analysis.llmReasoning.ambiguity.length === 0) && (
                  <li className="text-sm text-muted-foreground italic">No ambiguity detected.</li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="flex items-center gap-2 font-medium mb-3 text-sm">
                <Lightbulb className="h-4 w-4 text-emerald-500" />
                AI Suggestions
              </h4>
              <ul className="space-y-2">
                {analysis.llmReasoning?.suggestions?.map((item: string, i: number) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="md:col-span-2 flex justify-between border-t pt-4">
            <Badge variant="outline" className="font-mono text-xs">Data Sources: JD Raw Text</Badge>
            <Badge className="text-xs">Confidence: High</Badge>
          </div>
        </CardContent>
      ) : (
        <CardContent className="pt-6 pb-6 text-center text-muted-foreground text-sm">
          Run the hybrid analyzer to extract deterministic metrics and LLM insights for this Job Description.
        </CardContent>
      )}
    </Card>
  );
}
