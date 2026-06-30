"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  GitBranch,
  UserCheck,
  CheckCircle2,
  CalendarCheck,
  Upload,
  RefreshCw,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { StatCard } from "@/components/dashboard/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { UploadModal } from "@/components/upload/upload-modal";
import { ActivityFeed } from "@/components/agents/activity-feed";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FunnelStats {
  uploaded: number;
  resumeParsed: number;
  githubAnalysed: number;
  eligible: number;
  assessmentPassed: number;
  interviewReady: number;
  recentActivities: any[];
  topCandidates?: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<FunnelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stats");
      if (res.ok) {
        setStats(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isEmpty = !loading && (stats?.uploaded === 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Recruitment Funnel & Pipeline Overview
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            } />
            <TooltipContent>Refresh Dashboard Data</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={
              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  const toastId = toast.loading("Initializing intelligence agents...");
                  try {
                    const res = await fetch('/api/orchestrator/batch', { method: 'POST' });
                    if (res.ok) {
                      toast.success("Intelligence pipeline triggered", { id: toastId });
                      fetchData();
                    } else {
                      toast.error("Failed to trigger pipeline", { id: toastId });
                    }
                  } catch (e) {
                    toast.error("Error triggering pipeline", { id: toastId });
                  }
                }}
                className="gap-1.5"
              >
                <Brain className="h-3.5 w-3.5" />
                Initialize Intelligence
              </Button>
            } />
            <TooltipContent>Run Evaluation and GitHub Agents</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger render={
              <Button
                className="gradient-brand text-white border-0 hover:opacity-90 transition-opacity gap-1.5"
                size="sm"
                onClick={() => setUploadOpen(true)}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Candidates
              </Button>
            } />
            <TooltipContent>Upload CSV or Excel Candidates</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-8 w-48 rounded" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
        </div>
      ) : isEmpty ? (
        <EmptyState
          title="No candidates yet"
          description="Upload a CSV or Excel file with candidate data to get started. The platform will automatically begin the intelligence pipeline."
          actionLabel="Upload Candidates"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Hero Area: Hiring Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold tracking-tight">Hiring Recommendations</h2>
            <div className="space-y-4">
              {stats?.topCandidates && stats.topCandidates.map((candidate: any, index: number) => {
                const match = candidate.matches?.[0];
                const score = match?.overallScore || 0;
                
                let recommendationColor = "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
                let actionText = "Review Candidate";
                if (match?.recommendation === "STRONG_HIRE") {
                  recommendationColor = "bg-green-500/10 text-green-600 border-green-500/20";
                  actionText = "✓ Interview Today";
                } else if (match?.recommendation === "HIRE") {
                  recommendationColor = "bg-blue-500/10 text-blue-600 border-blue-500/20";
                  actionText = "Needs Technical Interview";
                } else if (match?.recommendation === "FURTHER_EVALUATION") {
                  actionText = "Review Career Gap";
                }

                const displayRec = match?.recommendation?.replace(/_/g, " ") || "REVIEW";

                return (
                  <div key={candidate.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm hover:border-primary/50 transition-all gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
                        {index === 0 && (
                          <>
                            <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" style={{ animationDuration: '3s' }} />
                            <div className="absolute inset-1 rounded-full bg-blue-500/30 animate-pulse" />
                            <div className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.6)] border border-blue-300 flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full border border-blue-200/50" />
                            </div>
                          </>
                        )}
                        {index === 1 && (
                          <>
                            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                            <div className="absolute inset-1 rounded-full bg-amber-500/30 animate-pulse" />
                            <div className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] border border-amber-200 flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full border border-amber-100/50" />
                            </div>
                          </>
                        )}
                        {index === 2 && (
                          <>
                            <div className="absolute inset-0 rounded-full bg-slate-400/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                            <div className="absolute inset-1 rounded-full bg-slate-400/30 animate-pulse" />
                            <div className="relative z-10 w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 shadow-[0_0_15px_rgba(148,163,184,0.6)] border border-slate-200 flex items-center justify-center">
                              <div className="w-4 h-4 rounded-full border border-slate-100/50" />
                            </div>
                          </>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg truncate max-w-[150px] sm:max-w-[200px]" title={candidate.name}>{candidate.name}</h3>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${recommendationColor}`}>
                            {Math.round(score)}% {displayRec}
                          </span>
                          {match?.fallbackUsed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/20 uppercase tracking-wider">
                              Deterministic Fallback Used
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 uppercase tracking-wider">
                              ✨ AI Evaluated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 sm:border-l sm:border-border sm:pl-4">
                      <div className="text-sm font-medium text-foreground whitespace-nowrap">
                        {actionText}
                      </div>
                      <Link href={`/candidates/${candidate.id}`} className="shrink-0">
                        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          View Profile
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Feed Side Panel */}
          <div className="lg:col-span-1">
            <ActivityFeed activities={stats?.recentActivities || []} />
          </div>

        </div>
      )}

      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={fetchData}
      />
    </div>
  );
}
