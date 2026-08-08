import React from "react";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: "indigo" | "slate" | "amber" | "emerald" | "rose";
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
    indigo: "bg-infiniq-indigo/10 text-infiniq-indigo border-infiniq-indigo/25",
    slate: "bg-infiniq-slate/8 text-infiniq-text-secondary border-infiniq-border",
    amber: "bg-amber-500/8 text-amber-400 border-amber-500/25",
    emerald: "bg-emerald-500/8 text-emerald-400 border-emerald-500/25",
    rose: "bg-rose-500/8 text-rose-400 border-rose-500/25",
  };

  const dotStyles = {
    indigo: "bg-infiniq-indigo",
    slate: "bg-infiniq-text-muted",
    amber: "bg-amber-400",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-medium border uppercase tracking-wider ${variantStyles[variant]} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[variant]}`} aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
