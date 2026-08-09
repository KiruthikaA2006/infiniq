"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CoreState } from "@/types/core";

interface StatusIndicatorProps {
  state: CoreState;
  className?: string;
}

export default function StatusIndicator({ state, className = "" }: StatusIndicatorProps) {
  const shouldReduceMotion = useReducedMotion();

  const stateDetails: Record<CoreState, { label: string; color: string; dotColor: string }> = {
    idle: { label: "System Ready", color: "text-infiniq-text-muted", dotColor: "bg-infiniq-text-muted" },
    listening: { label: "Listening", color: "text-infiniq-accent", dotColor: "bg-infiniq-accent" },
    thinking: { label: "Analyzing reasoning", color: "text-infiniq-accent-highlight", dotColor: "bg-infiniq-accent" },
    analyzing: { label: "Analyzing reasoning", color: "text-infiniq-accent-highlight", dotColor: "bg-infiniq-accent" },
    synthesizing: { label: "Synthesizing pathways", color: "text-infiniq-accent-secondary", dotColor: "bg-infiniq-accent-secondary" },
    understanding: { label: "Synthesizing pathways", color: "text-infiniq-accent-secondary", dotColor: "bg-infiniq-accent-secondary" },
    "follow-up": { label: "Formulating follow-up", color: "text-infiniq-accent", dotColor: "bg-infiniq-accent" },
    complete: { label: "Evaluation complete", color: "text-infiniq-success", dotColor: "bg-infiniq-success" },
    completed: { label: "Evaluation complete", color: "text-infiniq-success", dotColor: "bg-infiniq-success" },
  };

  const current = stateDetails[state] || stateDetails.idle;

  const renderMicroIndicator = () => {
    if (shouldReduceMotion) {
      return <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`} />;
    }

    switch (state) {
      case "listening":
        return (
          <div className="flex items-center gap-0.5 h-3">
            {[1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className={`w-[1.5px] rounded-full ${current.dotColor}`}
                animate={{ height: ["4px", "12px", "4px"] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.8,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        );
      case "thinking":
        return (
          <motion.div
            className="w-3 h-3 border border-transparent border-t-infiniq-accent border-r-infiniq-accent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
        );
      case "understanding":
        return (
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`}
            animate={{ scale: [1, 1.35, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          />
        );
      default:
        return <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`} />;
    }
  };

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {renderMicroIndicator()}
      <span className={`font-mono text-xs uppercase tracking-wider font-medium ${current.color}`}>
        {current.label}
      </span>
    </div>
  );
}
