import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "accent" | "olive" | "slate" | "amber" | "emerald" | "rose" | "indigo";
  showDot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = "slate",
  showDot = false,
  className = "",
}: BadgeProps) {
  const variantStyles = {
    accent: "bg-infiniq-accent/10 text-infiniq-accent border-infiniq-accent/25",
    indigo: "bg-infiniq-accent/10 text-infiniq-accent border-infiniq-accent/25",
    olive: "bg-infiniq-accent-secondary/10 text-infiniq-accent-secondary border-infiniq-accent-secondary/25",
    slate: "bg-infiniq-surface-2 text-infiniq-text-secondary border-infiniq-border",
    amber: "bg-infiniq-warning/10 text-infiniq-warning border-infiniq-warning/25",
    emerald: "bg-infiniq-success/10 text-infiniq-success border-infiniq-success/25",
    rose: "bg-infiniq-error/10 text-infiniq-error border-infiniq-error/25",
  };

  const dotStyles = {
    accent: "bg-infiniq-accent",
    indigo: "bg-infiniq-accent",
    olive: "bg-infiniq-accent-secondary",
    slate: "bg-infiniq-text-muted",
    amber: "bg-infiniq-warning",
    emerald: "bg-infiniq-success",
    rose: "bg-infiniq-error",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-medium border uppercase tracking-wider select-none ${variantStyles[variant]} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
