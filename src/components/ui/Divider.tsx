import React from "react";

interface DividerProps {
  label?: string;
  badge?: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export default function Divider({
  label,
  badge,
  orientation = "horizontal",
  className = "",
}: DividerProps) {
  if (orientation === "vertical") {
    return (
      <div
        className={`w-[1px] self-stretch bg-gradient-to-b from-transparent via-infiniq-border to-transparent ${className}`}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  return (
    <div
      className={`relative flex items-center w-full ${className}`}
      role="separator"
      aria-orientation="horizontal"
    >
      <div className="flex-grow h-[1px] bg-gradient-to-r from-transparent to-infiniq-border" />
      
      {(label || badge) && (
        <div className="mx-4 flex-shrink-0 select-none">
          {badge ? (
            badge
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-wider text-infiniq-text-muted">
              {label}
            </span>
          )}
        </div>
      )}

      <div className="flex-grow h-[1px] bg-gradient-to-r from-infiniq-border to-transparent" />
    </div>
  );
}
