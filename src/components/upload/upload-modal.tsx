"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import {
  Upload,
  FileSpreadsheet,
  FileWarning,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UploadPreviewRow {
  rowIndex: number;
  name: string;
  email: string;
  college?: string;
  branch?: string;
  cgpa?: string;
  resumeLink?: string;
  githubProfile?: string;
  errors: string[];
  warnings?: string[];
  isDuplicate: boolean;
}

interface ValidationResult {
  totalRows: number;
  validRows: number;
  errorRows: number;
  duplicateRows: number;
  preview: UploadPreviewRow[];
  rawData: Record<string, string>[];
}

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
}

type Step = "upload" | "preview" | "importing" | "success";

export function UploadModal({
  open,
  onOpenChange,
  onUploadComplete,
}: UploadModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importWithDuplicates, setImportWithDuplicates] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");

  useEffect(() => {
    fetch("/api/jobs")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
          if (data.length > 0) setSelectedJobId(data[0].id);
        }
      })
      .catch(err => console.error("Failed to fetch jobs", err));
  }, []);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setValidation(null);
    setUploading(false);
    setImporting(false);
    setImportProgress(0);
    setImportWithDuplicates(false);
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const uploadedFile = acceptedFiles[0];
      if (!uploadedFile) return;

      const ext = uploadedFile.name.split(".").pop()?.toLowerCase();
      if (ext !== "csv" && ext !== "xlsx" && ext !== "xls") {
        toast.error("Invalid file type", {
          description: "Please upload a CSV or Excel file.",
        });
        return;
      }

      if (!selectedJobId) {
        toast.error("No Job Selected", {
          description: "Please select a job for these candidates.",
        });
        return;
      }

      setFile(uploadedFile);
      setUploading(true);
      setImportWithDuplicates(false);

      try {
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result: ValidationResult = await response.json();
        setValidation(result);
        setStep("preview");

        if (result.validRows > 0 || result.duplicateRows > 0) {
          toast.success("File parsed successfully", {
            description: `Found ${result.validRows} pristine candidates and ${result.duplicateRows} duplicates.`,
          });
        } else {
          toast.warning("No valid candidates found", {
            description: "Please check the file format and try again.",
          });
        }
      } catch (error) {
        toast.error("Upload failed", {
          description:
            error instanceof Error ? error.message : "Something went wrong",
        });
        reset();
      } finally {
        setUploading(false);
      }
    },
    [reset, selectedJobId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    maxFiles: 1,
    multiple: false,
    disabled: uploading,
  });

  const handleConfirmImport = async () => {
    if (!validation) return;

    setImporting(true);
    setStep("importing");
    setImportProgress(10);

    try {
      const validData = validation.rawData.filter((_, i) => {
        const preview = validation.preview[i];
        return preview.errors.length === 0 && (!preview.isDuplicate || importWithDuplicates);
      });

      setImportProgress(30);

      const response = await fetch("/api/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: validData, jobId: selectedJobId }),
      });

      setImportProgress(70);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Import failed");
      }

      const result = await response.json();
      setImportProgress(100);

      setTimeout(() => {
        setStep("success");
        onUploadComplete();
      }, 500);
    } catch (error) {
      toast.error("Import failed", {
        description:
          error instanceof Error ? error.message : "Something went wrong",
      });
      setStep("preview");
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen && step === "success") {
          onOpenChange(isOpen);
          setTimeout(reset, 200);
        } else if (!isOpen) {
          reset();
          onOpenChange(isOpen);
        } else {
          onOpenChange(isOpen);
        }
      }}
    >
      <DialogContent className="glass-strong sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Candidates
          </DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              "Upload a CSV or Excel file with candidate data."}
            {step === "preview" && "Review parsed data before importing."}
            {step === "importing" && "Importing candidates..."}
            {step === "success" && "Import complete!"}
          </DialogDescription>
        </DialogHeader>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 pb-2">
          {["Upload", "Preview", "Import", "Summary"].map((label, i) => {
            const stepMap: Step[] = ["upload", "preview", "importing", "success"];
            const currentIndex = stepMap.indexOf(step);
            const isActive = i === currentIndex;
            const isDone = i < currentIndex;

            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all",
                    isActive && "gradient-brand text-white shadow-md",
                    isDone && "bg-success/20 text-success",
                    !isActive && !isDone && "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium hidden sm:block",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
                {i < 3 && (
                  <div className="flex-1 h-px bg-border mx-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step 1: Upload */}
        {step === "upload" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-foreground">Target Job for Candidates</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                <option value="" disabled>Select a Job...</option>
                {jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.title}</option>
                ))}
              </select>
            </div>
          <div
            {...getRootProps()}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all cursor-pointer",
              isDragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-border/50 hover:border-primary/50 hover:bg-muted/30",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            <input {...getInputProps()} />

            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
                <p className="text-sm font-medium">Parsing file...</p>
              </div>
            ) : isDragActive ? (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-primary animate-bounce" />
                <p className="text-sm font-medium text-primary">
                  Drop your file here
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <FileSpreadsheet className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drag & drop your file, or{" "}
                    <span className="text-primary">browse</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Supports CSV and Excel (.xlsx) files
                  </p>
                </div>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === "preview" && validation && (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-success/10 border border-success/20 p-3 text-center">
                <p className="text-2xl font-bold text-success">
                  {validation.validRows}
                </p>
                <p className="text-[10px] uppercase font-semibold text-success/80 tracking-wider">Ready to Import</p>
              </div>
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center">
                <p className="text-2xl font-bold text-destructive">
                  {validation.errorRows}
                </p>
                <p className="text-[10px] uppercase font-semibold text-destructive/80 tracking-wider">Requires Review</p>
              </div>
              <div className="rounded-lg bg-warning/10 border border-warning/20 p-3 text-center">
                <p className="text-2xl font-bold text-warning">
                  {validation.duplicateRows}
                </p>
                <p className="text-[10px] uppercase font-semibold text-warning/80 tracking-wider">Existing Candidates</p>
              </div>
            </div>

            {/* Preview table */}
            <div className="flex-1 max-h-[300px] overflow-y-auto rounded-lg border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>College</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validation.preview.map((row) => (
                    <TableRow
                      key={row.rowIndex}
                      className={cn(
                        row.errors.length > 0 && "bg-destructive/5",
                        row.isDuplicate && "bg-warning/5"
                      )}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.rowIndex}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {row.name || (
                          <span className="text-destructive italic">
                            Missing
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.email || (
                          <span className="text-destructive italic">
                            Missing
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.college || "—"}
                      </TableCell>
                      <TableCell>
                        {row.errors.length === 0 && !row.isDuplicate ? (
                          <Badge
                            variant="outline"
                            className="bg-success/10 text-success border-success/20 text-[10px]"
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : row.isDuplicate && row.errors.length === 0 ? (
                          <Badge
                            variant="outline"
                            className="bg-warning/10 text-warning border-warning/20 text-[10px]"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Duplicate
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Error details */}
            {validation.preview.some((r) => r.errors.length > 0) && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/10 p-3 max-h-24 overflow-y-auto">
                <p className="text-xs font-medium text-destructive mb-1">
                  Validation Errors:
                </p>
                {validation.preview
                  .filter((r) => r.errors.length > 0)
                  .slice(0, 5)
                  .map((r) => (
                    <p
                      key={r.rowIndex}
                      className="text-xs text-destructive/80"
                    >
                      Row {r.rowIndex}: {r.errors.join(", ")}
                    </p>
                  ))}
              </div>
            )}
            
            {/* Warning details */}
            {validation.preview.some((r) => r.warnings && r.warnings.length > 0) && (
              <div className="rounded-lg bg-warning/5 border border-warning/10 p-3 max-h-24 overflow-y-auto mt-2">
                <p className="text-xs font-medium text-warning mb-1">
                  Import Warnings:
                </p>
                {validation.preview
                  .filter((r) => r.warnings && r.warnings.length > 0)
                  .slice(0, 5)
                  .map((r) => (
                    <p
                      key={r.rowIndex}
                      className="text-xs text-warning/80"
                    >
                      Row {r.rowIndex}: {r.warnings?.join(", ")}
                    </p>
                  ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2">
              {validation.duplicateRows > 0 && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted/50 border border-border">
                  <input 
                    type="checkbox" 
                    id="import-duplicates" 
                    checked={importWithDuplicates}
                    onChange={(e) => setImportWithDuplicates(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="import-duplicates" className="text-xs font-medium cursor-pointer">
                    Import Anyway: Include {validation.duplicateRows} candidates with duplicate emails
                  </label>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="sm" onClick={reset} className="cursor-pointer">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {importWithDuplicates 
                      ? validation.validRows + validation.duplicateRows
                      : validation.validRows} of {validation.totalRows} will be imported
                  </span>
                  <Button
                    className="gradient-brand text-white border-0 cursor-pointer"
                    size="sm"
                    onClick={handleConfirmImport}
                    disabled={importWithDuplicates ? (validation.validRows + validation.duplicateRows === 0) : validation.validRows === 0}
                  >
                    Import {importWithDuplicates ? validation.validRows + validation.duplicateRows : validation.validRows} Candidates
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Importing */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center py-12 gap-6">
            <div className="relative">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Importing candidates...</p>
              <p className="text-xs text-muted-foreground">
                Resume parsing will begin automatically
              </p>
            </div>
            <div className="w-full max-w-xs">
              <Progress value={importProgress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground mt-2">
                {importProgress}%
              </p>
            </div>
          </div>
        )}
        {/* Step 4: Summary */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-12 gap-5 animate-in fade-in zoom-in duration-300">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10 border-4 border-green-500/20">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold tracking-tight">Import Complete!</h3>
              <p className="text-sm text-muted-foreground max-w-[350px] mx-auto">
                Successfully imported <strong className="text-foreground">{importWithDuplicates ? (validation?.validRows || 0) + (validation?.duplicateRows || 0) : (validation?.validRows || 0)} candidates</strong>. 
                Our autonomous AI agents have been deployed to parse resumes and evaluate them.
              </p>
            </div>
            <Button 
              className="mt-4 w-full sm:w-auto px-8 cursor-pointer" 
              onClick={() => onOpenChange(false)}
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
