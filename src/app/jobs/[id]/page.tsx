"use client";

import { useCallback, useEffect, useState, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Users, Brain, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ComparisonModal } from "@/components/matcher/comparison-modal";
import { JdAnalyzer } from "@/components/jobs/jd-analyzer";
import { WhatIfSimulator } from "@/components/jobs/what-if-simulator";
import { TalentIntelligence } from "@/components/jobs/talent-intelligence";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [job, setJob] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState<string | null>(null);

  const fetchJob = useCallback(() => {
    fetch(`/api/jobs/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        setJob(data);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  const fetchCandidates = useCallback(() => {
    fetch("/api/candidates")
      .then((res) => res.json())
      .then((data) => {
        setCandidates(Array.isArray(data) ? data : []);
      });
  }, []);

  useEffect(() => {
    fetchJob();
    fetchCandidates();
  }, [fetchJob, fetchCandidates]);

  const handleMatch = async (candidateId: string) => {
    setMatching(candidateId);
    try {
      await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: resolvedParams.id, candidateId }),
      });
      fetchJob();
    } catch (e) {
      console.error(e);
    } finally {
      setMatching(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-20"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!job || job.error) {
    return <div className="text-center p-20">Job not found.</div>;
  }

  const jd = job.structuredData || {};
  const matches = job.matches || [];
  
  // Sort candidates by match score
  const sortedCandidates = [...candidates].sort((a, b) => {
    const matchA = matches.find((m: any) => m.candidateId === a.id);
    const matchB = matches.find((m: any) => m.candidateId === b.id);
    return (matchB?.overallScore || 0) - (matchA?.overallScore || 0);
  });

  return (
    <div className="space-y-6 animate-slide-up pb-20">
      <Button variant="ghost" size="sm" render={<Link href="/jobs" />} className="gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
          <p className="text-muted-foreground mt-1">
            {job.department || "No Department"} • Added {new Date(job.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <JdAnalyzer job={job} onAnalyzed={fetchJob} />
      
      <div className="mt-6 mb-6 space-y-6">
        <TalentIntelligence matches={matches} />
        <WhatIfSimulator jobId={job.id} initialMatches={matches.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Parsed Requirements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {jd.mustHaveSkills?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Must Have Skills</h4>
                  <div className="flex flex-wrap gap-1">
                    {jd.mustHaveSkills.map((skill: string, i: number) => (
                      <Badge key={i} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {jd.technologies?.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-1">
                    {jd.technologies.map((tech: string, i: number) => (
                      <Badge key={i} variant="outline">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between bg-muted/30 pb-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Candidate Matches
                </CardTitle>
                <CardDescription>Ranked by AI Engine</CardDescription>
              </div>
              <div>
                <ComparisonModal candidates={sortedCandidates.filter(c => matches.some((m:any) => m.candidateId === c.id))} matches={matches} jobId={job.id} />
              </div>
            </CardHeader>
            <CardContent className="pt-4 p-0">
              <div className="divide-y border-t">
                {sortedCandidates.map((candidate) => {
                  const match = matches.find((m: any) => m.candidateId === candidate.id);
                  const isMatching = matching === candidate.id;

                  return (
                    <div key={candidate.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-muted/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-medium">
                          {candidate.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium">{candidate.name}</h4>
                          <p className="text-sm text-muted-foreground">{candidate.email}</p>
                        </div>
                      </div>

                      {match ? (
                        <div className="flex items-center gap-4 text-right">
                          <div className="text-sm">
                            <div className="font-medium flex items-center justify-end gap-1">
                              {match.overallScore?.toFixed(0)}% Match
                            </div>
                            <div className={
                              match.recommendation === "HIGHLY_RECOMMENDED" ? "text-green-500" :
                              match.recommendation === "RECOMMENDED" ? "text-amber-500" : "text-destructive"
                            }>
                              {match.recommendation.replace("_", " ")}
                            </div>
                          </div>
                          <Button size="sm" variant="outline" render={<Link href={`/candidates/${candidate.id}`} />}>
                            Profile
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleMatch(candidate.id)} disabled={isMatching}>
                          {isMatching ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running...</>
                          ) : (
                            <><Sparkles className="mr-2 h-4 w-4" /> Run Engine</>
                          )}
                        </Button>
                      )}
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
