"use client";

import React from "react";
import Button from "./Button";
import { DevLabel, BodyText, SectionHeading } from "./Typography";
import { AlertCircle, FileQuestion, RefreshCw } from "lucide-react";

// --- LOADING STATE ---
interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = "Synthesizing environment..." }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center rounded-lg border border-infiniq-border bg-infiniq-surface-1">
      {/* Precision loader */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <span className="absolute w-full h-full border border-infiniq-border rounded-full" />
        <span className="absolute w-full h-full border border-transparent border-t-infiniq-accent border-r-infiniq-accent rounded-full animate-spin" />
      </div>
      <DevLabel className="animate-pulse text-infiniq-text-secondary">{label}</DevLabel>
    </div>
  );
}

// --- EMPTY STATE ---
interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "No candidates found",
  description = "No candidates match the specified filter or query.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center rounded-lg border border-infiniq-border bg-infiniq-surface-1">
      <div className="p-3 mb-4 rounded-full border border-infiniq-border bg-infiniq-surface-2 text-infiniq-text-muted">
        <FileQuestion size={20} strokeWidth={1.5} />
      </div>
      <SectionHeading className="mb-2 text-base">{title}</SectionHeading>
      <BodyText className="max-w-[320px] mb-5 text-xs text-infiniq-text-muted leading-relaxed">
        {description}
      </BodyText>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// --- ERROR STATE ---
interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Evaluation Session Interrupted",
  description = "A temporary connection interruption occurred. Your session state is preserved.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-infiniq-error/25 bg-infiniq-surface-1">
      <div className="p-2.5 mb-3 rounded-full text-infiniq-error bg-infiniq-error/10 border border-infiniq-error/20">
        <AlertCircle size={22} strokeWidth={1.5} />
      </div>
      <h3 className="font-mono text-xs uppercase tracking-wider text-infiniq-error font-bold mb-1.5">
        {title}
      </h3>
      <BodyText className="max-w-[320px] mb-5 text-xs text-infiniq-text-secondary leading-relaxed">
        {description}
      </BodyText>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="border-infiniq-error/30 text-infiniq-error hover:bg-infiniq-error/10"
        >
          <RefreshCw size={12} className="mr-1.5" />
          Retry Connection
        </Button>
      )}
    </div>
  );
}
