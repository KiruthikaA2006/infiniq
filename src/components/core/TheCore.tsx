"use client";

import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TheCoreProps } from "@/types/core";

export default function TheCore({ state, className = "" }: TheCoreProps) {
  const shouldReduceMotion = useReducedMotion();

  // Define spring transition configs for scientific, high-precision motion
  const springConfig = {
    type: "spring",
    stiffness: shouldReduceMotion ? 20 : 60,
    damping: shouldReduceMotion ? 15 : 25,
    mass: 1,
  };

  // Helper variables for styling based on state
  const isIdle = state === "idle";
  const isListening = state === "listening";
  const isThinking = state === "thinking";
  const isUnderstanding = state === "understanding";
  const isComplete = state === "complete";

  // Base opacities to ensure subtle "invisible intelligence"
  const getOuterGridOpacity = () => {
    if (isUnderstanding) return 0.04;
    if (isThinking) return 0.12;
    if (isListening) return 0.15;
    return 0.08;
  };

  return (
    <div
      className={`relative flex items-center justify-center w-64 h-64 mx-auto ${className}`}
      role="img"
      aria-label={`AI Interviewer State: ${state}. Scientific visualization of reasoning.`}
    >
      {/* Background soft focus light - extremely subtle and low contrast */}
      <motion.div
        className="absolute inset-0 rounded-full bg-infiniq-indigo/3 filter blur-[40px] pointer-events-none"
        animate={{
          opacity: isIdle ? 0.3 : isListening ? 0.6 : isThinking ? 0.8 : isUnderstanding ? 0.9 : 0.2,
          scale: isUnderstanding ? 0.85 : 1,
        }}
        transition={springConfig as any}
      />

      <svg
        viewBox="0 0 200 200"
        className="w-full h-full text-infiniq-slate"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Definition of gradients and markers for clean vector work */}
        <defs>
          <linearGradient id="indigo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="scientific-line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
            <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Outer Scientific Calibration Ring with ticks */}
        <motion.g
          animate={{
            rotate: shouldReduceMotion ? 0 : isThinking ? 360 : isListening ? -45 : 0,
          }}
          transition={
            (isThinking
              ? { repeat: Infinity, duration: 25, ease: "linear" }
              : springConfig) as any
          }
          className="origin-center"
        >
          {/* Main outer ring */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity={getOuterGridOpacity()}
            strokeDasharray="2 6"
          />
          {/* Calibration ticks */}
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity={getOuterGridOpacity() * 0.5}
            strokeDasharray="1 19.26" // Generates exactly 30 tick marks
          />
        </motion.g>

        {/* 2. Layered Concentric Rings - Scientific Depth */}
        {/* Ring 3 (Outer Concentric) */}
        <motion.circle
          cx="100"
          cy="100"
          r="72"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          animate={{
            scale: isIdle ? [0.99, 1.01, 0.99] : isListening ? 1.03 : isThinking ? 0.96 : isUnderstanding ? 0.9 : 1.1,
            opacity: isIdle ? 0.08 : isListening ? 0.18 : isThinking ? 0.15 : isUnderstanding ? 0.22 : 0.02,
          }}
          transition={
            (isIdle
              ? { repeat: Infinity, duration: 6, ease: "easeInOut" }
              : springConfig) as any
          }
          className="origin-center"
        />

        {/* Ring 2 (Middle Concentric) */}
        <motion.circle
          cx="100"
          cy="100"
          r="52"
          fill="none"
          stroke="url(#indigo-gradient)"
          strokeWidth="1"
          animate={{
            scale: isIdle ? [1.02, 0.98, 1.02] : isListening ? 0.95 : isThinking ? 1.04 : isUnderstanding ? 0.88 : 1.2,
            opacity: isIdle ? 0.12 : isListening ? 0.25 : isThinking ? 0.2 : isUnderstanding ? 0.3 : 0.01,
          }}
          transition={
            (isIdle
              ? { repeat: Infinity, duration: 5, ease: "easeInOut" }
              : springConfig) as any
          }
          className="origin-center"
        />

        {/* Ring 1 (Inner Concentric) */}
        <motion.circle
          cx="100"
          cy="100"
          r="32"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          animate={{
            scale: isIdle ? [0.98, 1.02, 0.98] : isListening ? 1.05 : isThinking ? 0.92 : isUnderstanding ? 0.85 : 1.3,
            opacity: isIdle ? 0.15 : isListening ? 0.3 : isThinking ? 0.25 : isUnderstanding ? 0.4 : 0.02,
          }}
          transition={
            (isIdle
              ? { repeat: Infinity, duration: 4, ease: "easeInOut" }
              : springConfig) as any
          }
          className="origin-center"
        />

        {/* 3. Mathematical Wave Paths representing data processing */}
        {/* Wave 1: Sine wave representation */}
        <motion.path
          d={
            isListening
              // Active voice frequency curves
              ? "M 40 100 Q 70 80, 100 100 T 160 100"
              : isThinking
              // Highly analytical phase trails
              ? "M 40 100 C 60 70, 80 130, 100 100 C 120 70, 140 130, 160 100"
              : isUnderstanding
              // Perfectly flat structured curve
              ? "M 40 100 Q 100 100, 160 100"
              : isComplete
              // Wide ripple
              ? "M 40 100 Q 100 95, 160 100"
              : "M 40 100 Q 100 98, 160 100" // Idle: flat line with negligible curve
          }
          fill="none"
          stroke="url(#scientific-line-gradient)"
          strokeWidth="1.25"
          animate={{
            opacity: isIdle ? 0.15 : isComplete ? 0.05 : 0.35,
          }}
          transition={springConfig as any}
        />

        {/* Wave 2: Opposing phase curve for analytical depth */}
        {(isListening || isThinking) && (
          <motion.path
            d={
              isListening
                ? "M 40 100 Q 70 120, 100 100 T 160 100"
                : "M 40 100 C 60 130, 80 70, 100 100 C 120 130, 140 70, 160 100"
            }
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="1 2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.18 }}
            exit={{ opacity: 0 }}
            transition={springConfig as any}
          />
        )}

        {/* 4. The Nucleus (Scientific Center Node) */}
        <motion.circle
          cx="100"
          cy="100"
          r={isUnderstanding ? "5" : "3"}
          fill="currentColor"
          animate={{
            opacity: isIdle ? 0.25 : isListening ? 0.5 : isThinking ? 0.6 : isUnderstanding ? 0.8 : 0.1,
            scale: isIdle ? [1, 1.15, 1] : isListening ? [1, 1.3, 1] : isUnderstanding ? 1.4 : 1,
          }}
          transition={
            (isIdle || isListening
              ? { repeat: Infinity, duration: isListening ? 1.5 : 3, ease: "easeInOut" }
              : springConfig) as any
          }
          className="text-infiniq-indigo"
        />

        {/* 5. Complete Pulse Ripple Wave */}
        {isComplete && (
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#6366f1"
            strokeWidth="0.5"
            initial={{ scale: 0.1, opacity: 0.8 }}
            animate={{ scale: 1.1, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="origin-center"
          />
        )}

        {/* 6. Precision Crosshair Markers */}
        <g opacity="0.08" stroke="currentColor" strokeWidth="0.5">
          <line x1="100" y1="4" x2="100" y2="12" />
          <line x1="100" y1="188" x2="100" y2="196" />
          <line x1="4" y1="100" x2="12" y2="100" />
          <line x1="188" y1="100" x2="196" y2="100" />
        </g>
      </svg>
    </div>
  );
}
