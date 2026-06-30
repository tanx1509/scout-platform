"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";

type Status = "PENDING" | "PROCESSING" | "PARSED" | "FAILED";

interface StatusBadgeProps {
  status: Status;
  confidence?: number | null;
  showConfidence?: boolean;
  size?: "sm" | "md";
}

const statusConfig: Record<
  Status,
  {
    label: string;
    icon: typeof Clock;
    className: string;
    dotClass: string;
  }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-warning/10 text-warning border-warning/20 hover:bg-warning/15",
    dotClass: "bg-warning",
  },
  PROCESSING: {
    label: "Processing",
    icon: Loader2,
    className:
      "bg-info/10 text-info border-info/20 hover:bg-info/15",
    dotClass: "bg-info animate-pulse-brand",
  },
  PARSED: {
    label: "Parsed",
    icon: CheckCircle2,
    className:
      "bg-success/10 text-success border-success/20 hover:bg-success/15",
    dotClass: "bg-success",
  },
  FAILED: {
    label: "Failed",
    icon: XCircle,
    className:
      "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
    dotClass: "bg-destructive",
  },
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 80) return "text-success";
  if (confidence >= 50) return "text-warning";
  return "text-destructive";
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 80) return "High confidence";
  if (confidence >= 50) return "Medium confidence — may need review";
  return "Low confidence — needs manual review";
}

export function StatusBadge({
  status,
  confidence,
  showConfidence = true,
  size = "md",
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium transition-all",
        config.className,
        size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2 py-0.5"
      )}
    >
      <Icon
        className={cn(
          "shrink-0",
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
          status === "PROCESSING" && "animate-spin"
        )}
      />
      {config.label}
      {showConfidence &&
        status === "PARSED" &&
        confidence !== null &&
        confidence !== undefined && (
          <span className={cn("font-bold ml-0.5", getConfidenceColor(confidence))}>
            {confidence}%
          </span>
        )}
    </Badge>
  );

  if (status === "PARSED" && confidence !== null && confidence !== undefined) {
    return (
      <Tooltip>
        <TooltipTrigger render={badge} />
        <TooltipContent>
          <p className="text-xs">{getConfidenceLabel(confidence)}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
