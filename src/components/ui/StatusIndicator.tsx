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

  const stateDetails = {
    idle: { label: "System Ready", color: "text-infiniq-text-muted", dotColor: "bg-infiniq-text-muted" },
    listening: { label: "Listening", color: "text-infiniq-indigo", dotColor: "bg-infiniq-indigo" },
    thinking: { label: "Analyzing reasoning", color: "text-infiniq-violet", dotColor: "bg-infiniq-violet" },
    understanding: { label: "Synthesizing pathways", color: "text-infiniq-text-primary", dotColor: "bg-infiniq-text-primary" },
    complete: { label: "Evaluation complete", color: "text-emerald-400", dotColor: "bg-emerald-400" },
  };

  const current = stateDetails[state];

  // Render micro animations next to text based on state
  const renderMicroIndicator = () => {
    if (shouldReduceMotion) {
      return <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`} />;
    }

    switch (state) {
      case "listening":
        // Simulated voice bars
        return (
          <div className="flex items-center gap-0.5 h-3">
            {[1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className={`w-[1px] rounded-full ${current.dotColor}`}
                animate={{ height: ["4px", "12px", "4px"] }}
                transition={{
                  repeat: Infinity,
                  duration: 0.6,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        );
      case "thinking":
        // Precise rotating dash
        return (
          <motion.div
            className="w-3 h-3 border border-transparent border-t-infiniq-violet border-r-infiniq-violet rounded-full"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        );
      case "understanding":
        // Solid pulse scale
        return (
          <motion.span
            className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        );
      default:
        // Default static dot
        return <span className={`w-1.5 h-1.5 rounded-full ${current.dotColor}`} />;
    }
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {renderMicroIndicator()}
      <span className={`font-mono text-xs uppercase tracking-wider font-semibold ${current.color}`}>
        {current.label}
      </span>
    </div>
  );
}
