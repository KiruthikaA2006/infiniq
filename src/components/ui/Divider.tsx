import React from "react";

interface DividerProps {
  label?: string;
  className?: string;
}

export default function Divider({ label, className = "" }: DividerProps) {
  if (!label) {
    return <hr className={`border-t border-infiniq-border/60 my-4 ${className}`} />;
  }

  return (
    <div className={`relative flex items-center justify-center my-6 select-none ${className}`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-infiniq-border/50" />
      </div>
      <div className="relative bg-infiniq-bg px-3">
        <span className="font-mono text-[9px] uppercase tracking-widest text-infiniq-text-muted">
          {label}
        </span>
      </div>
    </div>
  );
}
