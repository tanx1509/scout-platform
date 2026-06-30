import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, History } from "lucide-react";

export function HistoricalBenchmark({ data }: { data: any[] }) {
  if (!data) return null;

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Benchmark Against Historical Hiring
        </CardTitle>
        <CardDescription>
          Comparing current active roles against historical internal performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.map((item, i) => (
            <div key={i} className="flex items-start gap-4 p-4 rounded-lg border bg-card">
              <div className={`p-2 rounded-full ${item.trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                {item.trend === 'up' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">{item.metric}</div>
                <div className={`text-2xl font-bold ${item.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  {item.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
