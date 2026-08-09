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
      className={`text-2xl sm:text-3xl lg:text-4xl font-light tracking-tight text-infiniq-text-primary leading-[1.15] ${className}`}
    >
      {children}
    </h1>
  );
}

export function SectionHeading({ children, className = "", id }: TypographyProps) {
  return (
    <h2
      id={id}
      className={`text-lg sm:text-xl font-medium tracking-tight text-infiniq-text-primary ${className}`}
    >
      {children}
    </h2>
  );
}

export function BodyText({ children, className = "", id }: TypographyProps) {
  return (
    <p
      id={id}
      className={`text-sm sm:text-base text-infiniq-text-secondary leading-relaxed font-normal ${className}`}
    >
      {children}
    </p>
  );
}

export function DevLabel({ children, className = "", id }: TypographyProps) {
  return (
    <span
      id={id}
      className={`font-mono text-[10px] sm:text-xs uppercase tracking-widest text-infiniq-text-muted font-medium select-none ${className}`}
    >
      {children}
    </span>
  );
}
