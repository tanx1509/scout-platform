"use client";

import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-slide-up">
      {/* Illustration */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-primary/5 blur-3xl scale-150" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl glass border-dashed border-2 border-primary/20">
          <div className="flex flex-col items-center gap-1">
            <FileSpreadsheet className="h-10 w-10 text-primary/40" />
            <Upload className="h-5 w-5 text-primary/30 animate-bounce" />
          </div>
        </div>
      </div>

      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
        {description}
      </p>

      {action && (
        <Button
          className="mt-6 gradient-brand text-white border-0 hover:opacity-90 transition-opacity"
          onClick={action.onClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      )}
    </div>
  );
}
