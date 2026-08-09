import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  className?: string;
  showSubtitle?: boolean;
  href?: string;
  size?: "sm" | "md" | "lg";
}

export default function BrandLogo({
  className = "",
  showSubtitle = false,
  href = "/",
  size = "md",
}: BrandLogoProps) {
  const isLg = size === "lg";
  const isSm = size === "sm";

  const content = (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Golden Sunburst / Orbital Intelligence Mark */}
      <div className={`relative flex items-center justify-center flex-shrink-0 ${isLg ? 'w-8 h-8' : isSm ? 'w-5 h-5' : 'w-6 h-6'}`}>
        <svg viewBox="0 0 24 24" className="w-full h-full text-infiniq-accent animate-spin-very-slow" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Central sun circle */}
          <circle cx="12" cy="12" r="3.5" fill="#D7CE83" fillOpacity="0.9" />
          <circle cx="12" cy="12" r="6" stroke="#D7CE83" strokeWidth="0.75" strokeOpacity="0.4" strokeDasharray="1 2" />
          
          {/* 12 Radiant Rays */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
            <line
              key={i}
              x1="12"
              y1="2.5"
              x2="12"
              y2="4.5"
              stroke="#D7CE83"
              strokeWidth={i % 2 === 0 ? "1.25" : "0.75"}
              strokeLinecap="round"
              strokeOpacity={i % 2 === 0 ? "0.9" : "0.6"}
              transform={`rotate(${angle} 12 12)`}
            />
          ))}
        </svg>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col">
        <span className={`font-sans font-semibold tracking-tight text-infiniq-text-primary ${isLg ? 'text-lg' : isSm ? 'text-xs' : 'text-sm'}`}>
          Infini<span className="text-infiniq-accent font-bold">Q</span>
        </span>
        {showSubtitle && (
          <span className="font-mono text-[7px] uppercase tracking-widest text-infiniq-text-muted -mt-0.5">
            AI INTERVIEWER
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center infiniq-focus rounded">
        {content}
      </Link>
    );
  }

  return content;
}
