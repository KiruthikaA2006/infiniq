import React from "react";

interface TypographyProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function CinematicHeading({ children, className = "", id }: TypographyProps) {
  return (
    <h1
      id={id}
      className={`text-2xl sm:text-3xl font-light tracking-wide text-transparent bg-clip-text bg-gradient-to-b from-[#f8fafc] to-[#94a3b8] leading-tight select-none ${className}`}
    >
      {children}
    </h1>
  );
}

export function SectionHeading({ children, className = "", id }: TypographyProps) {
  return (
    <h2
      id={id}
      className={`text-lg sm:text-xl font-medium tracking-wide text-synapse-text-primary ${className}`}
    >
      {children}
    </h2>
  );
}

export function BodyText({ children, className = "", id }: TypographyProps) {
  return (
    <p
      id={id}
      className={`text-sm sm:text-base text-synapse-text-secondary leading-relaxed font-normal ${className}`}
    >
      {children}
    </p>
  );
}

export function DevLabel({ children, className = "", id }: TypographyProps) {
  return (
    <span
      id={id}
      className={`font-mono text-[10px] sm:text-xs uppercase tracking-wider text-synapse-text-muted font-semibold select-none ${className}`}
    >
      {children}
    </span>
  );
}
