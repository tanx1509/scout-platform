import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users, BookOpen, MapPin, Database } from "lucide-react";

export function TalentIntelligence({ matches }: { matches: any[] }) {
  // Mock aggregation based on the matches passed in.
  // In a real app, this would be computed server-side or via an API.
  const totalCandidates = matches.length;
  const strongMatches = matches.filter(m => m.overallScore > 85).length;
  const avgMatch = matches.length > 0 ? (matches.reduce((sum, m) => sum + (m.overallScore || 0), 0) / matches.length).toFixed(0) : 0;

  return (
    <Card className="border-t-4 border-t-blue-500 shadow-sm mt-6">
      <CardHeader className="pb-4 border-b bg-muted/10">
        <CardTitle className="text-lg flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Database className="h-5 w-5" />
          Internal Talent Intelligence
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="space-y-4 col-span-1 md:col-span-4 lg:col-span-1 border-r-0 lg:border-r pr-0 lg:pr-6">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Eligible Pool</span>
            <span className="text-3xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-blue-500"/> {totalCandidates}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Strong Matches</span>
            <span className="text-2xl font-bold text-emerald-500">{strongMatches}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Avg Match Score</span>
            <span className="text-2xl font-bold text-blue-500">{avgMatch}%</span>
          </div>
        </div>

        <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
              <BookOpen className="h-4 w-4" /> Top Missing Skills
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded border">
                <span className="font-medium">Kubernetes</span>
                <span className="text-muted-foreground text-xs">Present in 8%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded border">
                <span className="font-medium">GraphQL</span>
                <span className="text-muted-foreground text-xs">Present in 14%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded border">
                <span className="font-medium">System Design</span>
                <span className="text-muted-foreground text-xs">Present in 21%</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> Source Performance
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded border border-l-4 border-l-blue-500">
                <span className="font-medium">LinkedIn Sourcing</span>
                <span className="text-muted-foreground text-xs">Avg Match 84%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded border border-l-4 border-l-purple-500">
                <span className="font-medium">Direct Apply</span>
                <span className="text-muted-foreground text-xs">Avg Match 71%</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/30 rounded border border-l-4 border-l-amber-500">
                <span className="font-medium">Referrals</span>
                <span className="text-muted-foreground text-xs">Avg Match 88%</span>
              </div>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
}
