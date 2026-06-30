"use client";

import { useCallback, useEffect, useState } from "react";
import { Upload, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CandidateTable } from "@/components/candidates/candidate-table";
import { UploadModal } from "@/components/upload/upload-modal";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTable } from "@/components/ui/skeleton-table";

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

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/candidates?page=${page}&limit=1000`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const hasProcessing = candidates.some(
      (c) => c.resume?.status === "PROCESSING" || c.resume?.status === "PENDING"
    );
    if (!hasProcessing) return;
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [candidates, fetchData]);

  const isEmpty = !loading && total === 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Candidates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and manage all candidate profiles
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
          <Button
            className="gradient-brand text-white border-0 hover:opacity-90 transition-opacity gap-1.5"
            size="sm"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        </div>
      </div>

      {loading ? (
        <SkeletonTable columns={6} rows={10} />
      ) : isEmpty ? (
        <EmptyState
          title="No candidates yet"
          description="Upload a CSV or Excel file to start building your candidate pipeline."
          actionLabel="Upload Candidates"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <>
          <CandidateTable
            candidates={candidates}
            total={total}
            page={page}
            totalPages={totalPages}
            loading={loading}
            onPageChange={setPage}
            onRefresh={fetchData}
          />
          {totalPages > 1 && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploadComplete={fetchData}
      />
    </div>
  );
}
