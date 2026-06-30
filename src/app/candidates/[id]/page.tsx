"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  Code2,
  Award,
  BookOpen,
  Globe,
  ExternalLink,
  Code,
  Link as LinkIcon,
  RefreshCw,
  FileText,
  AlertCircle,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { NotesLabelsSidebar } from "@/components/candidates/notes-labels";
import { CopilotChat } from "@/components/candidates/copilot-chat";
import { ActivityFeed } from "@/components/agents/activity-feed";
import { DecisionPanel } from "@/components/candidates/decision-panel";
import { ExplainabilityPanel } from "@/components/candidates/explainability-panel";

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  branch: string | null;
  cgpa: number | null;
  bestAiProject: string | null;
  researchWork: string | null;
  githubProfile: string | null;
  linkedinProfile: string | null;
  createdAt: string;
  resume: {
    status: string;
    sourceUrl: string | null;
    rawText: string | null;
    errorMessage: string | null;
  } | null;
  matches?: {
    status: string;
    overallScore: number | null;
    recommendation: string | null;
    evidence: any;
    technicalScore: number | null;
    projectScore: number | null;
    researchScore: number | null;
    githubScore: number | null;
    assessmentScore: number | null;
  }[];
  assessments?: {
    logicalScore: number | null;
    codingScore: number | null;
    status: string;
  }[];
  profile: any;
  activities?: any[];
}

export default function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = useCallback(async () => {
    try {
      const res = await fetch(`/api/candidates/${resolvedParams.id}`);
      if (res.ok) {
        setCandidate(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch candidate:", error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams.id]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-[200px] w-full rounded-xl" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Candidate not found.</p>
        <Button variant="ghost" nativeButton={false} render={<Link href="/candidates" />} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Candidates
        </Button>
      </div>
    );
  }

  const match = candidate.matches?.[0];
  const assessment = candidate.assessments?.[0];
  
  const score = match?.overallScore || 0;
  const recommendation = match?.recommendation || (score > 85 ? "Highly Recommended" : score > 70 ? "Recommended" : "Needs Review");
  const stage = match?.status || "APPLIED";

  const renderRecommendationColor = () => {
    if (score >= 85) return "text-green-500 bg-green-500/10 border-green-500/20";
    if (score >= 70) return "text-blue-500 bg-blue-500/10 border-blue-500/20";
    return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
  };

  const renderStars = () => {
    const rec = recommendation.replace(/_/g, ' ').toUpperCase();
    if (rec.includes('STRONG')) return '★★★★★';
    if (rec.includes('DO NOT PROCEED') || rec.includes('REJECT')) return '★☆☆☆☆';
    if (score >= 80) return '★★★★☆';
    if (score >= 70) return '★★★☆☆';
    return '★★☆☆☆';
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/candidates" />} className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to Candidates
      </Button>

      {/* 1. Hiring Recommendation (Hero Section) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <Avatar className="h-24 w-24 border-4 border-background shadow-md">
          <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
            {candidate.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="space-y-4 max-w-xl">
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight">{candidate.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <span>{candidate.email}</span>
              {candidate.phone && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{candidate.phone}</span>
                </>
              )}
            </div>
            {(candidate.college || candidate.branch) && (
              <div className="text-sm font-semibold text-primary pt-1">
                {candidate.branch} {candidate.college ? `@ ${candidate.college}` : ''}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {(() => {
              const tags = [];
              if (score >= 90) tags.push({ label: "Top Talent", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" });
              if (candidate.githubProfile) tags.push({ label: "Open Source", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" });
              if (match?.technicalScore && match.technicalScore >= 85) tags.push({ label: "Strong Coder", color: "bg-green-500/10 text-green-500 border-green-500/20" });
              if (candidate.branch?.toLowerCase().includes("computer") || candidate.branch?.toLowerCase().includes("software")) tags.push({ label: "CS Core", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" });
              if (tags.length === 0) tags.push({ label: "Needs Review", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" });
              return tags.map((t, i) => (
                <Badge key={i} variant="outline" className={`text-xs px-2 py-0.5 ${t.color}`}>
                  {t.label}
                </Badge>
              ));
            })()}
          </div>

          <div className="flex gap-2 pt-2">
            {candidate.githubProfile && (
              <Button size="sm" variant="outline" nativeButton={false} className="gap-2 h-8" render={<a href={candidate.githubProfile} target="_blank" />}>
                <Code className="h-3 w-3"/> GitHub
              </Button>
            )}
            {candidate.resume?.sourceUrl && (
              <Button size="sm" variant="outline" nativeButton={false} className="gap-2 h-8" render={<a href={candidate.resume.sourceUrl} target="_blank" />}>
                <ExternalLink className="h-3 w-3"/> Resume
              </Button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 pt-4 border-t border-border/50 mt-4">
            {stage === "APPLIED" ? (
              <Button 
                size="sm" 
                className="gradient-brand text-white border-0 shadow-md cursor-pointer hover:opacity-90 transition-opacity gap-1.5 px-6"
                onClick={async () => {
                  const toastId = toast.loading("Sending Assessment...");
                  try {
                    const res = await fetch("/api/outreach/test", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ candidateIds: [candidate.id] })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast.success(`Assessment sent automatically ${data.demoMode ? '(Demo Mode)' : ''}`, { id: toastId });
                      // Also update status to SCREENING/ASSESSMENT
                      await fetch(`/api/candidates/${candidate.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "SCREENING", action: "Triggered Assessment" })
                      });
                      fetchCandidate();
                    } else {
                      toast.error("Failed to send test link", { id: toastId });
                    }
                  } catch (e) {
                    toast.error("Error sending test link", { id: toastId });
                  }
                }}
              >
                Trigger Assessment
              </Button>
            ) : stage === "SCREENING" || stage === "ASSESSMENT" ? (
              <Button 
                size="sm" 
                className="gradient-brand text-white border-0 shadow-md cursor-pointer hover:opacity-90 transition-opacity gap-1.5 px-6"
                onClick={async () => {
                  const toastId = toast.loading("Scheduling Interview...");
                  try {
                    const res = await fetch("/api/outreach/schedule", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ candidateIds: [candidate.id], summary: "Technical Round" })
                    });
                    const data = await res.json();
                    if (res.ok) {
                      const result = data.results?.[0];
                      const emailSent = result?.emailSent;
                      toast.success(
                        emailSent
                          ? `✅ Email sent directly to candidate!`
                          : `Interview scheduled — opening Gmail compose...`,
                        { id: toastId }
                      );
                      await fetch(`/api/candidates/${candidate.id}/status`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ status: "INTERVIEW", action: "Triggered Interview" })
                      });
                      fetchCandidate();

                      // Only open compose if direct send failed
                      if (!emailSent && result?.gmailComposeUrl) {
                        window.open(result.gmailComposeUrl, '_blank');
                      }
                    } else {
                      toast.error("Failed to schedule interview", { id: toastId });
                    }
                  } catch (e) {
                    toast.error("Error scheduling interview", { id: toastId });
                  }
                }}
              >
                Trigger Interview
              </Button>
            ) : stage === "INTERVIEW" ? (
              <Button 
                size="sm" 
                className="gradient-brand text-white border-0 shadow-md cursor-pointer hover:opacity-90 transition-opacity gap-1.5 px-6"
                onClick={async () => {
                  const toastId = toast.loading("Moving to Offer...");
                  try {
                    const res = await fetch(`/api/candidates/${candidate.id}/status`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "OFFER", action: "Moved to Offer" })
                    });
                    if (res.ok) {
                      toast.success("Moved to Offer stage", { id: toastId });
                      fetchCandidate();
                    }
                  } catch (e) {
                    toast.error("Error moving to offer", { id: toastId });
                  }
                }}
              >
                Move to Offer
              </Button>
            ) : null}

            <Button 
              size="sm" 
              variant="outline" 
              className="shadow-sm border-border cursor-pointer px-6"
              onClick={() => toast.success("Candidate kept in active pool.")}
            >
              Keep in Pool
            </Button>
            
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer px-6"
              onClick={async () => {
                const toastId = toast.loading("Rejecting candidate...");
                try {
                  const res = await fetch(`/api/candidates/${candidate.id}/status`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "REJECTED", action: "Candidate Rejected" })
                  });
                  if (res.ok) {
                    toast.success("Candidate rejected", { id: toastId });
                    fetchCandidate();
                  } else {
                    toast.error("Failed to update status", { id: toastId });
                  }
                } catch (e) {
                  toast.error("Error updating status", { id: toastId });
                }
              }}
            >
              Reject
            </Button>
          </div>
        </div>

        {/* Big Score Box (Wrapped in Explainability Panel) */}
        <ExplainabilityPanel match={match} defaultOpen={true}>
          <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 min-w-[240px] shadow-sm ${renderRecommendationColor()} hover:bg-background/50 transition-colors cursor-pointer`}>
            <span className="text-lg tracking-widest mb-1 text-primary">{renderStars()}</span>
            <span className="text-5xl font-black">{Math.round(score)}%</span>
            <span className="text-sm font-bold uppercase tracking-wider mt-2">{recommendation.replace(/_/g, ' ')}</span>
            <span className="text-xs font-medium text-muted-foreground mt-3 flex items-center gap-1 opacity-70"><ShieldCheck className="h-3 w-3" /> Click for Breakdown</span>
          </div>
        </ExplainabilityPanel>
      </div>

      <div className="border border-border/40 rounded-xl p-6 glass bg-card/40 shadow-sm">
        <h3 className="font-semibold text-lg mb-4">Candidate Timeline</h3>
        <ActivityFeed activities={candidate.activities || []} />
      </div>
      
      {/* Recruiter Decision Panel (Phase 2.5) */}
      <DecisionPanel candidate={candidate} match={match} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Column: Project, Github, Chat */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 4. Project & GitHub Deep Dive */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-border/40 shadow-sm glass bg-card/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Code2 className="h-4 w-4 text-primary"/> Best AI Project</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.bestAiProject ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">{candidate.bestAiProject}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No specific AI project highlighted in dataset.</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-sm glass bg-card/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary"/> Research Work</CardTitle>
              </CardHeader>
              <CardContent>
                {candidate.researchWork ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">{candidate.researchWork}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No specific research work highlighted.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <NotesLabelsSidebar candidateId={candidate.id} />
            <CopilotChat candidateId={candidate.id} />
          </div>

        </div>

        {/* Right Column: Skill Match & Resume Extract */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* 6. Skill Match (High Density Progress Bars) */}
          <Card className="border-border/40 shadow-sm overflow-hidden glass bg-card/40">
            <div className="bg-primary/5 border-b border-primary/10 px-6 py-4">
              <h2 className="font-semibold text-primary flex items-center gap-2"><BarChart2 className="h-4 w-4"/> Skill Match</h2>
            </div>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Technical</span>
                  <span className="font-bold">{match?.technicalScore ? Math.round(match.technicalScore) : 0}</span>
                </div>
                <Progress value={match?.technicalScore || 0} className="h-2 bg-blue-100 [&>div]:bg-blue-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Projects</span>
                  <span className="font-bold">{match?.projectScore ? Math.round(match.projectScore) : 0}</span>
                </div>
                <Progress value={match?.projectScore || 0} className="h-2 bg-emerald-100 [&>div]:bg-emerald-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Research</span>
                  <span className="font-bold">{match?.researchScore ? Math.round(match.researchScore) : 0}</span>
                </div>
                <Progress value={match?.researchScore || 0} className="h-2 bg-indigo-100 [&>div]:bg-indigo-600" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-muted-foreground">GitHub</span>
                  <span className="font-bold">{match?.githubScore ? Math.round(match.githubScore) : 0}</span>
                </div>
                <Progress value={match?.githubScore || 0} className="h-2 bg-slate-200 [&>div]:bg-slate-700" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-muted-foreground">Assessment</span>
                  <span className="font-bold">{match?.assessmentScore ? Math.round(match.assessmentScore) : 0}</span>
                </div>
                <Progress value={match?.assessmentScore || 0} className="h-2 bg-purple-100 [&>div]:bg-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* 5. Resume Raw — only shown when parseable plain text was extracted */}
          {(() => {
            const raw = candidate.resume?.rawText;
            const isReadable = raw && !raw.startsWith('%PDF') && !raw.startsWith('stream') && raw.trim().length > 50;
            if (!isReadable) return null;
            return (
              <Card className="border-border/40 shadow-sm glass bg-card/40">
                <CardHeader className="pb-3 border-b border-border/40">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Parsed Resume Text
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] w-full p-4 bg-muted/10">
                    <pre className="text-[11px] whitespace-pre-wrap font-mono text-muted-foreground leading-relaxed">
                      {raw}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })()}

        </div>
      </div>
    </div>
  );
}
