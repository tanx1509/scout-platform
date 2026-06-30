import * as React from "react";
import { cn } from "@/lib/utils";
import { Zap, ShieldCheck } from "lucide-react";

export function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">{eyebrow}</span>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
      </div>
      {action && <div>{action}</div>}
    </header>
  );
}

export function MatchBadge({ score }: { score: number }) {
  const colorClass =
    score >= 90
      ? "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
      : score >= 80
        ? "bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400"
        : "bg-slate-500/15 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400";
  const Icon = score >= 90 ? Zap : ShieldCheck;

  return (
    <div className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold", colorClass)}>
      <Icon size={12} className={score >= 90 ? "fill-current" : ""} />
      <span>{score} Match</span>
    </div>
  );
}

export function MetricMicro({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export function ChartCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="premium-card flex flex-col rounded-3xl p-5 sm:p-6">
      <header className="mb-6 flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-xl bg-slate-100 text-[var(--muted)] dark:bg-white/5">
          <Icon size={16} />
        </span>
        <h3 className="font-semibold">{title}</h3>
      </header>
      <div className="flex-1 min-h-[240px]">{children}</div>
    </section>
  );
}

export function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-[var(--muted)] dark:bg-white/10">
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
