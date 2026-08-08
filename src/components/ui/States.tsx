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
    <div className="flex flex-col items-center justify-center p-6 space-y-4 text-center rounded-lg border border-infiniq-border bg-infiniq-surface-1">
      {/* Precision loader */}
      <div className="relative w-8 h-8 flex items-center justify-center">
        <span className="absolute w-full h-full border border-infiniq-border rounded-full" />
        <span className="absolute w-full h-full border border-transparent border-t-infiniq-indigo border-r-infiniq-indigo rounded-full animate-spin" />
      </div>
      <DevLabel className="animate-pulse">{label}</DevLabel>
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
  title = "No datasets found",
  description = "Connect your repository or choose a standard evaluation template to start.",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-infiniq-border bg-infiniq-surface-1">
      <div className="p-3 mb-4 rounded-full border border-infiniq-border bg-infiniq-surface-2 text-infiniq-text-muted">
        <FileQuestion size={20} strokeWidth={1.5} />
      </div>
      <SectionHeading className="mb-2 text-base">{title}</SectionHeading>
      <BodyText className="max-w-[280px] mb-5 text-xs text-infiniq-text-muted leading-relaxed">
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
  title = "Evaluation failed",
  description = "A network timeout occurred while checking the response signatures. Please retry.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-rose-500/20 bg-rose-950/5">
      <div className="p-2 mb-3 rounded-full text-rose-400">
        <AlertCircle size={24} strokeWidth={1.5} />
      </div>
      <h3 className="font-mono text-sm uppercase tracking-wider text-rose-400 font-bold mb-2">
        {title}
      </h3>
      <BodyText className="max-w-[280px] mb-5 text-xs text-infiniq-text-muted leading-relaxed">
        {description}
      </BodyText>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="border-rose-500/20 text-rose-300 hover:bg-rose-500/10 hover:border-rose-400/30"
        >
          <RefreshCw size={12} className="mr-1.5 animate-spin-reverse" />
          Retry Connection
        </Button>
      )}
    </div>
  );
}
