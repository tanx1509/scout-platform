import { prisma } from "@/lib/db/prisma";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2, Users, FileText, CheckCircle2, TrendingUp, Award, AlertTriangle, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AnalyticsPage() {
  // Fetch real data for provenance-based analytics
  const totalCandidates = await prisma.candidate.count();
  
  if (totalCandidates === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 border border-dashed rounded-lg bg-card/50">
        <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold text-foreground tracking-tight mb-2">
          No Candidates Yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm text-center mb-6">
          Upload your first candidate to begin populating the analytics pipeline.
        </p>
        <Button render={<Link href="/candidates" />}>
          Go to Pipeline
        </Button>
      </div>
    );
  }

  const parsed = await prisma.resume.count({ where: { status: "PARSED" } });
  const matches = await prisma.jobMatch.findMany();
  
  // Simulated Pipeline Stages based on Match Recommendations
  const reviewedCount = matches.filter(m => m.recommendation !== "DO_NOT_PROCEED").length;
  const interviewedCount = matches.filter(m => m.recommendation === "STRONG_HIRE" || m.recommendation === "HIRE").length;
  const offeredCount = matches.filter(m => m.recommendation === "STRONG_HIRE").length; // Simulated for demo

  // 2. Talent Distribution
  const candidates = await prisma.candidate.findMany({
    include: { matches: true, assessments: true, resume: true }
  });

  const avgMatchQuality = matches.length > 0 
    ? matches.reduce((acc, m) => acc + (m.overallScore || 0), 0) / matches.length 
    : 0;

  // 3. Assessment Insights
  const assessments = candidates.flatMap(c => c.assessments);
  const avgCoding = assessments.length > 0 ? assessments.reduce((acc, a) => acc + (a.codingScore || 0), 0) / assessments.length : 0;
  const avgLogical = assessments.length > 0 ? assessments.reduce((acc, a) => acc + (a.logicalScore || 0), 0) / assessments.length : 0;
  const highestScore = assessments.length > 0 ? Math.max(...assessments.map(a => ((a.codingScore || 0) + (a.logicalScore || 0))/2)) : 0;
  const lowestScore = assessments.length > 0 ? Math.min(...assessments.map(a => ((a.codingScore || 0) + (a.logicalScore || 0))/2)) : 0;

  // 4. Recommendation Distribution
  const recDist = {
    strongHire: matches.filter(m => m.recommendation === "STRONG_HIRE").length,
    hire: matches.filter(m => m.recommendation === "HIRE").length,
    review: matches.filter(m => m.recommendation === "FURTHER_EVALUATION" || m.recommendation === "BORDERLINE").length,
    reject: matches.filter(m => m.recommendation === "DO_NOT_PROCEED").length,
  };

  // 5. Top 5 Candidates
  const topCandidates = [...candidates].sort((a, b) => {
    return (b.matches?.[0]?.overallScore || 0) - (a.matches?.[0]?.overallScore || 0);
  }).slice(0, 5);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <BarChart2 className="h-8 w-8 text-primary" />
          Enterprise Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Provenance-backed pipeline health and talent insights.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{totalCandidates}</div>
            <p className="text-xs text-muted-foreground mt-1">Applicants uploaded</p>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Match Quality</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{Math.round(avgMatchQuality)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Based on Resume + Assessment + GitHub</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Profiles Ready</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{parsed} / {totalCandidates}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalCandidates - parsed} require recruiter review
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Interviews Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{interviewedCount}</div>
            <p className="text-xs text-primary/80 mt-1">Candidates marked Strong Hire/Hire</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 space-y-8">
          {/* Pipeline Funnel */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
                Pipeline Health
              </CardTitle>
              <CardDescription>Funnel conversion based on AI recommendations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2"><Users className="h-4 w-4"/> Applicants</span>
                  <span className="font-bold">{totalCandidates}</span>
                </div>
                <Progress value={100} className="h-2 bg-slate-100 [&>div]:bg-slate-800" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2"><FileText className="h-4 w-4"/> Resumes Processed & Technical Profiles Analysed</span>
                  <span className="font-bold">{parsed}</span>
                </div>
                <Progress value={(parsed/totalCandidates)*100 || 0} className="h-2 bg-blue-100 [&>div]:bg-blue-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4"/> Shortlisted (Hire/Review)</span>
                  <span className="font-bold">{reviewedCount}</span>
                </div>
                <Progress value={(reviewedCount/totalCandidates)*100 || 0} className="h-2 bg-purple-100 [&>div]:bg-purple-600" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2"><TrendingUp className="h-4 w-4"/> Advance to Interview (Strong Hire)</span>
                  <span className="font-bold">{interviewedCount}</span>
                </div>
                <Progress value={(interviewedCount/totalCandidates)*100 || 0} className="h-2 bg-green-100 [&>div]:bg-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Assessment Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-500" />
                  Assessment Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Average Coding</span>
                  <span className="font-bold">{Math.round(avgCoding)}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Average Logical</span>
                  <span className="font-bold">{Math.round(avgLogical)}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 border border-border/50 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Highest</div>
                    <div className="text-lg font-black text-green-600">{Math.round(highestScore)}</div>
                  </div>
                  <div className="p-3 border border-border/50 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Lowest</div>
                    <div className="text-lg font-black text-red-500">{Math.round(lowestScore)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-blue-500" />
                  Recommendation Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600 font-semibold">Strong Hire</span>
                    <span className="font-bold">{recDist.strongHire}</span>
                  </div>
                  <Progress value={(recDist.strongHire/totalCandidates)*100 || 0} className="h-1.5 bg-green-100 [&>div]:bg-green-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600 font-semibold">Hire</span>
                    <span className="font-bold">{recDist.hire}</span>
                  </div>
                  <Progress value={(recDist.hire/totalCandidates)*100 || 0} className="h-1.5 bg-blue-100 [&>div]:bg-blue-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-yellow-600 font-semibold">Review / Borderline</span>
                    <span className="font-bold">{recDist.review}</span>
                  </div>
                  <Progress value={(recDist.review/totalCandidates)*100 || 0} className="h-1.5 bg-yellow-100 [&>div]:bg-yellow-600" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-red-500 font-semibold">Reject</span>
                    <span className="font-bold">{recDist.reject}</span>
                  </div>
                  <Progress value={(recDist.reject/totalCandidates)*100 || 0} className="h-1.5 bg-red-100 [&>div]:bg-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-primary/20 shadow-sm bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Award className="h-5 w-5" />
                Top Candidates
              </CardTitle>
              <CardDescription>Highest Match Quality scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCandidates.map((c, i) => {
                  const m = c.matches?.[0];
                  return (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-border shadow-sm hover:border-primary/50 transition-colors">
                      <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                          {i === 0 && '🥇'}
                          {i === 1 && '🥈'}
                          {i === 2 && '🥉'}
                          {i > 2 && <span className="w-5 text-center text-muted-foreground text-xs">{i+1}.</span>}
                          {c.name.split(" ")[0]} {c.name.split(" ")[1]?.charAt(0) || ''}.
                        </div>
                        <div className="text-xs text-muted-foreground pl-7">{c.college || 'Direct applicant'}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-black text-primary">{Math.round(m?.overallScore || 0)}%</span>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-muted-foreground" render={<Link href={`/candidates/${c.id}`} />}>
                          View <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
