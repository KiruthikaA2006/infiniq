"use client";

import React, { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { TheCoreProps, CoreState } from "@/types/core";

export default function TheCore({
  state = "idle",
  className = "",
  size = "md",
}: TheCoreProps) {
  const shouldReduceMotion = useReducedMotion();

  // Normalize state
  const isThinking = state === "thinking" || state === "analyzing";
  const isListening = state === "listening";
  const isSynthesizing = state === "synthesizing";
  const isComplete = state === "complete" || state === "completed";
  const isFollowUp = state === "follow-up" || state === "understanding";

  // Pre-calculated orbital ring definitions matching the reference visual
  const orbitalRings = useMemo(
    () => [
      // Ring 1: Primary inner bright circular halo
      { rx: 114, ry: 112, rot: -10, strokeWidth: 1.6, opacity: 0.85, dash: "none", duration: 55, dir: 1 },
      // Ring 2: Main tilted bright orbital band (right flare anchor)
      { rx: 132, ry: 108, rot: 22, strokeWidth: 1.8, opacity: 0.9, dash: "none", duration: 42, dir: 1 },
      // Ring 3: Tilted elliptical trajectory with dashed segment
      { rx: 148, ry: 96, rot: -32, strokeWidth: 1.2, opacity: 0.7, dash: "none", duration: 48, dir: -1 },
      // Ring 4: Fine dotted outer orbit
      { rx: 165, ry: 88, rot: 38, strokeWidth: 1.0, opacity: 0.55, dash: "2 5", duration: 65, dir: 1 },
      // Ring 5: Secondary crossing ellipse
      { rx: 142, ry: 102, rot: -68, strokeWidth: 1.1, opacity: 0.6, dash: "none", duration: 50, dir: -1 },
      // Ring 6: Wide outer faint dotted trajectory
      { rx: 172, ry: 80, rot: -18, strokeWidth: 0.9, opacity: 0.45, dash: "3 7", duration: 75, dir: 1 },
      // Ring 7: Tight inner luminous ring
      { rx: 108, ry: 106, rot: 5, strokeWidth: 1.4, opacity: 0.75, dash: "none", duration: 38, dir: -1 },
    ],
    []
  );

  // Internal neural/constellation network nodes inside the central orb
  const constellationNodes = useMemo(
    () => [
      { x: 160, y: 160 },
      { x: 200, y: 140 },
      { x: 240, y: 165 },
      { x: 150, y: 200 },
      { x: 250, y: 205 },
      { x: 165, y: 245 },
      { x: 200, y: 260 },
      { x: 235, y: 240 },
      { x: 185, y: 175 },
      { x: 215, y: 175 },
    ],
    []
  );

  const constellationEdges = useMemo(
    () => [
      [0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 7], [5, 6], [6, 7],
      [0, 8], [1, 8], [1, 9], [2, 9], [8, 9], [3, 8], [4, 9], [5, 8], [7, 9],
    ],
    []
  );

  // Golden stardust particles in orbital space (exact reference positions)
  const particles = useMemo(
    () => [
      { cx: 322, cy: 195, r: 2.8, glow: true, opacity: 0.95 },
      { cx: 345, cy: 145, r: 2.2, glow: true, opacity: 0.9 },
      { cx: 295, cy: 92, r: 2.0, glow: true, opacity: 0.85 },
      { cx: 200, cy: 75, r: 1.8, glow: false, opacity: 0.8 },
      { cx: 110, cy: 110, r: 2.4, glow: true, opacity: 0.85 },
      { cx: 75, cy: 195, r: 2.0, glow: false, opacity: 0.75 },
      { cx: 95, cy: 265, r: 2.2, glow: true, opacity: 0.8 },
      { cx: 155, cy: 310, r: 1.8, glow: false, opacity: 0.7 },
      { cx: 200, cy: 325, r: 2.0, glow: false, opacity: 0.75 },
      { cx: 270, cy: 312, r: 2.4, glow: true, opacity: 0.85 },
      { cx: 325, cy: 260, r: 2.2, glow: true, opacity: 0.8 },
      { cx: 355, cy: 225, r: 1.6, glow: false, opacity: 0.7 },
      { cx: 245, cy: 82, r: 1.4, glow: false, opacity: 0.65 },
      { cx: 145, cy: 90, r: 1.5, glow: false, opacity: 0.6 },
      { cx: 65, cy: 155, r: 1.6, glow: false, opacity: 0.7 },
      { cx: 300, cy: 335, r: 1.5, glow: false, opacity: 0.65 },
    ],
    []
  );

  return (
    <div
      className={`relative flex items-center justify-center select-none ${className}`}
      role="img"
      aria-label={`InfiniQ Core - ${state}`}
    >
      {/* Outer ambient golden atmospheric glow */}
      <motion.div
        className="absolute inset-2 sm:inset-4 rounded-full pointer-events-none filter blur-2xl sm:blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(215, 206, 131, 0.28) 0%, rgba(245, 224, 138, 0.12) 35%, rgba(168, 133, 52, 0.04) 65%, transparent 80%)",
        }}
        animate={{
          opacity: isThinking || isSynthesizing ? [0.75, 1, 0.75] : [0.55, 0.8, 0.55],
          scale: isThinking ? [0.96, 1.05, 0.96] : isListening ? [1, 1.04, 1] : [0.98, 1.02, 0.98],
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0.3 }
            : { repeat: Infinity, duration: isThinking ? 2.2 : 5.5, ease: "easeInOut" }
        }
      />

      <svg
        viewBox="0 0 400 400"
        className="w-full h-full overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Core metallic gold gradients */}
          <linearGradient id="infiniq-gold-bright" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF0" stopOpacity="0.95" />
            <stop offset="30%" stopColor="#F5E08A" stopOpacity="0.9" />
            <stop offset="70%" stopColor="#D7CE83" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#A88534" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="infiniq-gold-soft" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#D7CE83" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#F5E08A" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFFDF0" stopOpacity="0.95" />
          </linearGradient>

          {/* Central dark glass orb radial fill */}
          <radialGradient id="infiniq-core-glass" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#080907" stopOpacity="0.98" />
            <stop offset="65%" stopColor="#0E100D" stopOpacity="0.94" />
            <stop offset="88%" stopColor="#151712" stopOpacity="0.88" />
            <stop offset="98%" stopColor="#D7CE83" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFF8D0" stopOpacity="0.75" />
          </radialGradient>

          {/* Top-left spherical specular light */}
          <linearGradient id="infiniq-rim-light" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8D0" stopOpacity="0.9" />
            <stop offset="45%" stopColor="#D7CE83" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#D7CE83" stopOpacity="0" />
          </linearGradient>

          {/* Intense flare filters */}
          <filter id="infiniq-glow-intense" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="infiniq-glow-subtle" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ========================================================================= */}
        {/* 1. ORBITAL RING SYSTEM (Multiple luminous gold trajectories)              */}
        {/* ========================================================================= */}
        {orbitalRings.map((ring, idx) => (
          <motion.g
            key={`orbit-ring-${idx}`}
            animate={{
              rotate: shouldReduceMotion
                ? ring.rot
                : [ring.rot, ring.rot + (ring.dir * 360)],
            }}
            transition={
              shouldReduceMotion
                ? { duration: 0.3 }
                : {
                    repeat: Infinity,
                    duration: ring.duration * (isThinking ? 0.65 : 1),
                    ease: "linear",
                  }
            }
            className="origin-center"
          >
            <ellipse
              cx="200"
              cy="200"
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke="url(#infiniq-gold-bright)"
              strokeWidth={ring.strokeWidth}
              strokeOpacity={ring.opacity}
              strokeDasharray={ring.dash}
              filter={idx <= 2 ? "url(#infiniq-glow-subtle)" : undefined}
            />
          </motion.g>
        ))}

        {/* ========================================================================= */}
        {/* 2. CENTRAL DARK GLASS / CORE ORB                                          */}
        {/* ========================================================================= */}
        
        {/* Central Orb Shadow/Glow Base */}
        <circle
          cx="200"
          cy="200"
          r="106"
          fill="url(#infiniq-core-glass)"
          stroke="#D7CE83"
          strokeWidth="1.2"
          strokeOpacity="0.6"
        />

        {/* Internal Connected Neural Constellation (Subtle intelligence network) */}
        <g opacity={isThinking ? 0.45 : isComplete ? 0.4 : 0.25}>
          {constellationEdges.map(([from, to], i) => (
            <line
              key={`edge-${i}`}
              x1={constellationNodes[from].x}
              y1={constellationNodes[from].y}
              x2={constellationNodes[to].x}
              y2={constellationNodes[to].y}
              stroke="#D7CE83"
              strokeWidth="0.6"
              strokeOpacity="0.5"
            />
          ))}
          {constellationNodes.map((node, i) => (
            <circle
              key={`node-${i}`}
              cx={node.x}
              cy={node.y}
              r="1.4"
              fill="#FFF8D0"
              opacity="0.8"
            />
          ))}
        </g>

        {/* Spherical Specular Arc Lighting along Top/Left Rim */}
        <path
          d="M 120 150 A 104 104 0 0 1 280 150"
          fill="none"
          stroke="url(#infiniq-rim-light)"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* ========================================================================= */}
        {/* 3. MAJOR GOLDEN LIGHT FLARES (Right intersection & perimeter nodes)      */}
        {/* ========================================================================= */}
        
        {/* Primary Radiant Flare (Right Rim - Anchor visual from reference) */}
        <motion.g
          animate={{
            scale: isThinking || isSynthesizing ? [1, 1.25, 1] : [0.95, 1.08, 0.95],
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            repeat: Infinity,
            duration: isThinking ? 1.8 : 3.6,
            ease: "easeInOut",
          }}
          className="origin-[318px_208px]"
        >
          {/* Flare cross rays */}
          <ellipse cx="318" cy="208" rx="22" ry="1.5" fill="#FFFDF0" opacity="0.9" filter="url(#infiniq-glow-intense)" transform="rotate(-25 318 208)" />
          <ellipse cx="318" cy="208" rx="1.5" ry="18" fill="#FFFDF0" opacity="0.8" filter="url(#infiniq-glow-intense)" transform="rotate(-25 318 208)" />
          {/* Flare center hot spot */}
          <circle cx="318" cy="208" r="4.5" fill="#FFFDF0" filter="url(#infiniq-glow-intense)" />
          <circle cx="318" cy="208" r="2.2" fill="#FFFFFF" />
        </motion.g>

        {/* Secondary Flare (Top Left) */}
        <motion.g
          animate={{
            opacity: [0.6, 0.95, 0.6],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            repeat: Infinity,
            duration: 2.8,
            delay: 0.5,
            ease: "easeInOut",
          }}
          className="origin-[132px_128px]"
        >
          <circle cx="132" cy="128" r="3.2" fill="#FFFDF0" filter="url(#infiniq-glow-subtle)" />
          <circle cx="132" cy="128" r="1.5" fill="#FFFFFF" />
        </motion.g>

        {/* Secondary Flare (Bottom Right) */}
        <motion.g
          animate={{
            opacity: [0.5, 0.85, 0.5],
          }}
          transition={{
            repeat: Infinity,
            duration: 3.2,
            delay: 1.2,
            ease: "easeInOut",
          }}
        >
          <circle cx="280" cy="295" r="2.8" fill="#F5E08A" filter="url(#infiniq-glow-subtle)" />
          <circle cx="280" cy="295" r="1.3" fill="#FFFFFF" />
        </motion.g>

        {/* ========================================================================= */}
        {/* 4. DISTRIBUTED GOLDEN STARDUST PARTICLES                                  */}
        {/* ========================================================================= */}
        {particles.map((p, idx) => (
          <motion.circle
            key={`particle-${idx}`}
            cx={p.cx}
            cy={p.cy}
            r={p.r}
            fill="#FFF5B8"
            filter={p.glow ? "url(#infiniq-glow-subtle)" : undefined}
            animate={{
              opacity: shouldReduceMotion
                ? p.opacity
                : [p.opacity * 0.45, p.opacity, p.opacity * 0.45],
              scale: shouldReduceMotion ? 1 : [0.85, 1.25, 0.85],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2 + ((idx * 0.3) % 2.5),
              delay: (idx * 0.2) % 2,
              ease: "easeInOut",
            }}
          />
        ))}

      </svg>

      {/* ========================================================================= */}
      {/* 5. CENTER CORE BRAND & INTELLIGENCE TYPOGRAPHY (Exact Reference Match)    */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center select-none px-4">
        
        {/* "InfiniQ" with crisp warm ivory "Infini" and metallic gold "Q" */}
        <div className="flex items-baseline justify-center tracking-tight leading-none">
          <span className="font-sans font-bold text-2xl sm:text-3xl md:text-[34px] text-[#F5F3E8] drop-shadow-sm">
            Infini
          </span>
          <span className="font-sans font-bold text-2xl sm:text-3xl md:text-[34px] text-[#E5DC94] drop-shadow-sm">
            Q
          </span>
        </div>

        {/* Delicate golden accent horizontal line with center glowing dot */}
        <div className="flex items-center justify-center gap-1.5 w-24 sm:w-28 my-1.5 sm:my-2">
          <div className="h-[1px] flex-grow bg-gradient-to-r from-transparent via-[#D7CE83]/70 to-[#D7CE83]" />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#FFFDF0] shadow-[0_0_6px_#F5E08A]"
            animate={{
              scale: isThinking ? [1, 1.5, 1] : [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              repeat: Infinity,
              duration: isThinking ? 1.5 : 3.0,
              ease: "easeInOut",
            }}
          />
          <div className="h-[1px] flex-grow bg-gradient-to-l from-transparent via-[#D7CE83]/70 to-[#D7CE83]" />
        </div>

        {/* "THE CORE" in clean uppercase with generous tracking */}
        <span className="font-sans text-[9px] sm:text-[10.5px] font-semibold uppercase tracking-[0.28em] text-[#E8E5D8] drop-shadow-xs">
          THE CORE
        </span>

        {/* "ACTIVE INTELLIGENCE" in smaller uppercase secondary tracking */}
        <span className="font-mono text-[7px] sm:text-[8px] font-medium uppercase tracking-[0.24em] text-[#A6A59B] mt-0.5 sm:mt-1">
          ACTIVE INTELLIGENCE
        </span>

      </div>
    </div>
  );
}

// Re-export as InfiniQCore for seamless modularity
export { TheCore as InfiniQCore };
