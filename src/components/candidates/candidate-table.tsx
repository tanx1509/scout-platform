"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight, ExternalLink, GitBranch, Scale, BarChart2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  college: string | null;
  branch: string | null;
  cgpa: number | null;
  githubProfile: string | null;
  profileCompleteness: number;
  createdAt: string;
  resume: {
    status: string;
    parsingConfidence: number | null;
    errorMessage: string | null;
  } | null;
  matches: {
    status: string;
    overallScore: number | null;
    recommendation: string | null;
    technicalScore?: number | null;
    projectScore?: number | null;
    educationScore?: number | null;
    summary?: string | null;
    evidence?: any;
    risks?: any;
    interviewFocus?: any;
  }[];
  githubCache: {
    id: string;
  } | null;
  assessments: {
    logicalScore: number | null;
    codingScore: number | null;
    status: string;
  }[];
}

interface CandidateTableProps {
  candidates: CandidateRow[];
  total: number;
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

type SortKey = "name" | "cgpa" | "match" | "coding" | "quality" | "technical";

export function CandidateTable({
  candidates,
  total,
  page,
  totalPages,
  loading = false,
  onPageChange,
  onRefresh,
}: CandidateTableProps) {
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("match");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const filtered = useMemo(() => {
    let result = candidates;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = candidates.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          (c.college && c.college.toLowerCase().includes(q))
      );
    }
    
    return [...result].sort((a, b) => {
      let aVal: any = 0;
      let bVal: any = 0;

      if (sortKey === "name") {
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
      } else if (sortKey === "cgpa") {
        aVal = a.cgpa || 0;
        bVal = b.cgpa || 0;
      } else if (sortKey === "match") {
        aVal = a.matches?.[0]?.overallScore || 0;
        bVal = b.matches?.[0]?.overallScore || 0;
      } else if (sortKey === "coding") {
        aVal = a.assessments?.[0]?.codingScore || 0;
        bVal = b.assessments?.[0]?.codingScore || 0;
      } else if (sortKey === "quality") {
        aVal = a.resume?.parsingConfidence || 0;
        bVal = b.resume?.parsingConfidence || 0;
      } else if (sortKey === "technical") {
        aVal = a.matches?.[0]?.technicalScore || 0;
        bVal = b.matches?.[0]?.technicalScore || 0;
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [candidates, search, sortKey, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const renderQuality = (resume: CandidateRow["resume"]) => {
    if (!resume || resume.status === "FAILED") {
      return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 border-slate-200">Dataset Profile</span>;
    }
    if (resume.status === "PENDING" || resume.status === "PROCESSING") {
      return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 border-gray-200">Processing</span>;
    }
    
    const score = resume.parsingConfidence || 0;
    if (score >= 85) {
      return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800 border-green-200">Excellent</span>;
    } else if (score >= 70) {
      return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 border-blue-200">Strong</span>;
    }
    return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-100 text-yellow-800 border-yellow-200">Review Match</span>;
  };

  const renderSortIcon = (columnKey: string) => {
    if (sortKey !== columnKey) return <span className="ml-1 opacity-20 group-hover:opacity-50">↕</span>;
    return <span className="ml-1 text-primary">{sortOrder === "asc" ? "↑" : "↓"}</span>;
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Search & Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or college..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/30 border-border/30"
          />
        </div>
        <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2 h-9">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-rotate-cw h-4 w-4"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>
          Refresh Data
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/30 glass overflow-hidden relative">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/30">
              <TableHead className="w-12 text-center">
                <Checkbox 
                  checked={selectedIds.size === filtered.length && filtered.length > 0} 
                  onCheckedChange={toggleSelectAll} 
                />
              </TableHead>
              <TableHead className="w-[180px] cursor-pointer hover:text-primary group" onClick={() => handleSort("name")}>
                <div className="flex items-center">Candidate {renderSortIcon("name")}</div>
              </TableHead>
              <TableHead>College & Branch</TableHead>
              <TableHead className="w-[120px] cursor-pointer hover:text-primary group" onClick={() => handleSort("technical")}>
                <div className="flex items-center">Technical {renderSortIcon("technical")}</div>
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer hover:text-primary group" onClick={() => handleSort("quality")}>
                <div className="flex items-center">Quality {renderSortIcon("quality")}</div>
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer hover:text-primary group" onClick={() => handleSort("match")}>
                <div className="flex items-center">Match Score {renderSortIcon("match")}</div>
              </TableHead>
              <TableHead className="w-[120px] cursor-pointer hover:text-primary group" onClick={() => handleSort("coding")}>
                <div className="flex items-center">Assessment {renderSortIcon("coding")}</div>
              </TableHead>
              <TableHead className="w-[120px]">Stage</TableHead>
              <TableHead className="w-[80px] text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-muted-foreground"
                >
                  {search
                    ? "No candidates match your search."
                    : "No candidates yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((candidate, idx) => {
                const matchScore = candidate.matches?.[0]?.overallScore;
                const stage = candidate.matches?.[0]?.status || "APPLIED";
                const assessment = candidate.assessments?.[0];
                const isSelected = selectedIds.has(candidate.id);

                return (
                  <React.Fragment key={candidate.id}>
                  <TableRow
                    className={cn(
                      "group hover:bg-muted/20 transition-colors border-border/20",
                      isSelected && "bg-primary/5"
                    )}
                  >
                    <TableCell className="text-center">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelect(candidate.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/candidates/${candidate.id}`}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-9 w-9 border border-border/30">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {candidate.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[180px] group-hover:text-primary transition-colors" title={candidate.name}>
                            {candidate.name}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-muted-foreground truncate">
                              {candidate.email}
                            </p>
                            {candidate.githubCache && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <GitBranch className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>GitHub Analyzed</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {(() => {
                              const tags = [];
                              const m = candidate.matches?.[0];
                              if (m?.overallScore && m.overallScore >= 90) tags.push({ label: "Top Talent", color: "bg-purple-100 text-purple-700 border-purple-200" });
                              if (candidate.githubProfile) tags.push({ label: "Open Source", color: "bg-blue-100 text-blue-700 border-blue-200" });
                              if (m?.technicalScore && m.technicalScore >= 85) tags.push({ label: "Strong Coder", color: "bg-green-100 text-green-700 border-green-200" });
                              if (candidate.branch?.toLowerCase().includes("computer") || candidate.branch?.toLowerCase().includes("software")) tags.push({ label: "CS Core", color: "bg-slate-100 text-slate-700 border-slate-200" });
                              return tags.slice(0, 2).map((t, i) => (
                                <span key={i} className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-medium ${t.color}`}>
                                  {t.label}
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {candidate.college || "—"}
                      </span>
                      {candidate.branch && (
                        <span className="text-xs text-muted-foreground block">
                          {candidate.branch}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {candidate.cgpa ? (
                        <span className="text-sm font-semibold">{candidate.cgpa}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {renderQuality(candidate.resume)}
                    </TableCell>
                    <TableCell>
                      {matchScore ? (
                        <div className="flex items-center gap-1.5">
                          <BarChart2 className="h-4 w-4 text-primary" />
                          <span className="text-sm font-bold text-primary">{Math.round(matchScore)}%</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {assessment ? (
                        <div className="flex flex-col text-xs">
                          <span className="text-muted-foreground">LA: <span className="font-semibold text-foreground">{assessment.logicalScore || '-'}</span></span>
                          <span className="text-muted-foreground">Code: <span className="font-semibold text-foreground">{assessment.codingScore || '-'}</span></span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs capitalize font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground">
                        {stage.toLowerCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger render={
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              nativeButton={false}
                              render={<Link href={`/candidates/${candidate.id}`} />}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          } />
                          <TooltipContent>View Profile</TooltipContent>
                        </Tooltip>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-100"
                          onClick={(e) => toggleExpand(candidate.id, e)}
                        >
                          {expandedIds.has(candidate.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedIds.has(candidate.id) && (
                    <TableRow className="bg-muted/30 border-b border-border/20">
                      <TableCell colSpan={9} className="p-0">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2 fade-in duration-200">
                          
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Evaluation Summary</h4>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                              {candidate.matches?.[0]?.summary || "No AI evaluation summary available yet."}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Key Evidence</h4>
                            {candidate.matches?.[0]?.evidence ? (
                              <ul className="text-xs space-y-1">
                                {(candidate.matches[0].evidence as any[]).slice(0, 3).map((e: any, i: number) => (
                                  <li key={i} className="flex gap-2">
                                    <span className="text-green-600 shrink-0">✓</span>
                                    <span><span className="font-medium">{e.component}:</span> {e.fact}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-muted-foreground">No evidence extracted.</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Risks & Interview Focus</h4>
                            {candidate.matches?.[0]?.risks ? (
                              <ul className="text-xs space-y-1 mb-2">
                                {(candidate.matches[0].risks as any[]).slice(0, 2).map((r: any, i: number) => (
                                  <li key={i} className="flex gap-2 text-amber-700 dark:text-amber-400">
                                    <span className="shrink-0">⚠️</span>
                                    <span>{r.reason}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            
                            {candidate.matches?.[0]?.interviewFocus ? (
                              <div className="mt-2">
                                <h5 className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Suggested Questions</h5>
                                <ul className="text-xs space-y-1">
                                  {(candidate.matches[0].interviewFocus as string[]).slice(0, 2).map((q: string, i: number) => (
                                    <li key={i} className="flex gap-1.5 text-muted-foreground">
                                      <span className="shrink-0">•</span>
                                      <span className="truncate" title={q}>{q}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ) : null}
                          </div>
                          
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of{" "}
            {total} candidates
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 w-8 p-0",
                    pageNum === page && "gradient-brand text-white border-0"
                  )}
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar for Comparison */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 fade-in duration-300">
          <div className="bg-background/95 backdrop-blur-sm border shadow-lg rounded-full px-6 py-3 flex items-center gap-6">
            <span className="text-sm font-medium">
              <span className="text-primary mr-1">{selectedIds.size}</span>
              Candidate{selectedIds.size > 1 ? 's' : ''} Selected
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
              <Button size="sm" className="gradient-brand border-0 shadow-md gap-2" disabled={selectedIds.size < 2} render={<Link href={selectedIds.size >= 2 ? `/compare?ids=${Array.from(selectedIds).join(',')}` : '#'} />}>
                <Scale className="h-4 w-4" />
                Compare Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
