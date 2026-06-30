"use client";

import { cn } from "@/lib/utils";

interface ProfileCompletenessProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showDetails?: boolean;
  details?: {
    label: string;
    present: boolean;
  }[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 50) return "text-warning";
  return "text-destructive";
}

function getStrokeColor(score: number): string {
  if (score >= 80) return "stroke-success";
  if (score >= 50) return "stroke-warning";
  return "stroke-destructive";
}

function getTrackColor(score: number): string {
  if (score >= 80) return "stroke-success/15";
  if (score >= 50) return "stroke-warning/15";
  return "stroke-destructive/15";
}

export function ProfileCompleteness({
  score,
  size = "md",
  showDetails = false,
  details,
}: ProfileCompletenessProps) {
  const sizeMap = {
    sm: { svg: 48, stroke: 3, text: "text-xs", radius: 20 },
    md: { svg: 72, stroke: 4, text: "text-sm", radius: 30 },
    lg: { svg: 96, stroke: 5, text: "text-lg", radius: 40 },
  };

  const s = sizeMap[size];
  const circumference = 2 * Math.PI * s.radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: s.svg, height: s.svg }}>
        <svg
          width={s.svg}
          height={s.svg}
          viewBox={`0 0 ${s.svg} ${s.svg}`}
          className="-rotate-90"
        >
          {/* Background track */}
          <circle
            cx={s.svg / 2}
            cy={s.svg / 2}
            r={s.radius}
            fill="none"
            strokeWidth={s.stroke}
            className={getTrackColor(score)}
          />
          {/* Progress arc */}
          <circle
            cx={s.svg / 2}
            cy={s.svg / 2}
            r={s.radius}
            fill="none"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(getStrokeColor(score), "transition-all duration-1000 ease-out animate-progress-ring")}
            style={{ "--progress-offset": offset } as React.CSSProperties}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn("font-bold", s.text, getScoreColor(score))}>
            {score}%
          </span>
        </div>
      </div>
      {showDetails && details && (
        <div className="space-y-1">
          {details.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className={cn(
                  "inline-block w-1.5 h-1.5 rounded-full",
                  item.present ? "bg-success" : "bg-muted-foreground/30"
                )}
              />
              <span
                className={cn(
                  item.present
                    ? "text-foreground"
                    : "text-muted-foreground line-through"
                )}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
