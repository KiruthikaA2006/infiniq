"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValue?: boolean;
  className?: string;
  barClassName?: string;
}

export default function Progress({
  value,
  max = 100,
  label,
  showValue = true,
  className = "",
  barClassName = "",
}: ProgressProps) {
  const shouldReduceMotion = useReducedMotion();
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`w-full ${className}`} role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
      {/* Header labels */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5 font-mono text-[10px] uppercase tracking-wider text-infiniq-text-muted">
          <span>{label}</span>
          {showValue && <span className="text-infiniq-text-secondary">{Math.round(percentage)}%</span>}
        </div>
      )}
      
      {/* Bar container */}
      <div className="h-[3px] w-full rounded-full bg-infiniq-surface-2 border border-infiniq-border/40 overflow-hidden">
        <motion.div
          className={`h-full bg-infiniq-accent rounded-full ${barClassName}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={
            shouldReduceMotion
              ? { duration: 0.2 }
              : { type: "spring", stiffness: 80, damping: 20 }
          }
        />
      </div>
    </div>
  );
}
