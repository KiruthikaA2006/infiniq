"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Container from "@/components/layout/Container";
import TheCore from "@/components/core/TheCore";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { CinematicHeading, BodyText, DevLabel } from "@/components/ui/Typography";
import { CoreState } from "@/types/core";
import { Terminal, ArrowRight, Radio, Shield, Target, Cpu, LineChart } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [coreState, setCoreState] = useState<CoreState>("idle");
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  const handleBegin = () => {
    if (coreState === "idle") {
      setCoreState("listening");
      setTimeout(() => {
        router.push("/interview");
      }, 1200);
    }
  };

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
      },
    },
  };

  const textVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 85,
        damping: 20,
      },
    },
  };

  const coreVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 50,
        damping: 22,
      },
    },
  };

  return (
    <div className="min-h-screen bg-synapse-bg text-synapse-text-primary scientific-grid flex flex-col justify-between py-10 px-4 sm:px-6 relative overflow-hidden">
      
      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 select-none border-b border-synapse-border/40 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-synapse-text-muted" />
          <span className="font-mono text-xs tracking-wider text-synapse-text-muted font-bold">
            SYNAPSE // EVALUATION SYSTEM
          </span>
        </div>
        <Link
          href="/design-system"
          className="font-mono text-[9px] uppercase tracking-wider text-synapse-text-muted hover:text-synapse-indigo transition-colors synapse-focus py-1 px-2.5 rounded border border-synapse-border/60 hover:border-synapse-border bg-synapse-surface-1/40"
        >
          System Specs
        </Link>
      </header>

      {/* Main Content Workspace */}
      <main className="flex-grow w-full flex items-center justify-center py-6 sm:py-8 z-10">
        <Container isMobileLocked={false} className="w-full">
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* COLUMN 1: AI Presence & Headline Callout */}
            <div className="col-span-1 lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
              
              {/* The Core Container */}
              <motion.div variants={coreVariants} className="relative flex justify-center py-3">
                <TheCore state={coreState} className="w-32 h-32 sm:w-36 sm:h-36" />
                <div className="absolute -bottom-1 flex justify-center w-full">
                  <span className="font-mono text-[8px] uppercase tracking-widest text-synapse-text-muted/65 bg-synapse-bg/90 px-2 py-0.5 rounded border border-synapse-border/30">
                    {coreState === "idle" ? "BREATHING TELEMETRY" : "INGESTION STREAM ACTIVE"}
                  </span>
                </div>
              </motion.div>

              {/* Title & Badge */}
              <motion.div variants={textVariants} className="space-y-1">
                <div className="flex justify-center lg:justify-start">
                  <Badge variant={coreState === "listening" ? "indigo" : "slate"} className="text-[10px]">
                    {coreState === "listening" && <Radio size={10} className="mr-1 animate-pulse" />}
                    ADAPTIVE INTERVIEW ENGINE
                  </Badge>
                </div>
                <h2 className="font-sans font-light tracking-[0.2em] text-synapse-text-muted uppercase text-xs mt-2">
                  SYNAPSE INTERVIEW ENGINE
                </h2>
              </motion.div>

              {/* Cinematic Headline */}
              <motion.div variants={textVariants} className="space-y-3">
                <CinematicHeading className="text-2xl sm:text-3xl lg:text-4xl leading-tight tracking-wide max-w-lg">
                  Understand engineering thinking, not just answers.
                </CinematicHeading>
                <BodyText className="max-w-md text-xs sm:text-sm text-synapse-text-secondary leading-relaxed font-sans">
                  An intelligent assessment environment that evaluates systems architecture reasoning, trade-off awareness, and candidate learning history in real-time.
                </BodyText>
              </motion.div>

              {/* Primary CTA */}
              <motion.div variants={textVariants} className="pt-2 w-full sm:w-auto">
                <Button
                  variant={coreState === "listening" ? "primary" : "secondary"}
                  onClick={handleBegin}
                  className="w-full sm:w-[220px] h-12 text-sm"
                  disabled={coreState === "listening"}
                >
                  {coreState === "idle" ? (
                    <>
                      Start Technical Evaluation
                      <ArrowRight size={14} className="ml-2" />
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#f8fafc] animate-pulse mr-2" />
                      Initializing...
                    </>
                  )}
                </Button>
              </motion.div>

            </div>

            {/* COLUMN 2: Key Capabilities Grid */}
            <div className="col-span-1 lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Adaptive Questioning",
                  desc: "Engine generates deep scenarios based on candidate answers, avoiding trivia checkouts.",
                  icon: Cpu,
                  color: "text-synapse-indigo"
                },
                {
                  title: "Candidate-Aware Difficulty",
                  desc: "Evaluates completions and attempt signals to baseline initial difficulty parameters.",
                  icon: Target,
                  color: "text-emerald-400"
                },
                {
                  title: "Technical Reasoning Evaluation",
                  desc: "Analyzes architecture thinking, latency targets, and data storage trade-offs.",
                  icon: Shield,
                  color: "text-amber-400"
                },
                {
                  title: "Engineering Report Card",
                  desc: "Produces full scorecards with strengths, gaps, and decisions logs.",
                  icon: LineChart,
                  color: "text-synapse-violet"
                }
              ].map((cap, idx) => {
                const IconComponent = cap.icon;
                return (
                  <motion.div
                    key={idx}
                    variants={textVariants}
                    className="p-5 rounded border border-synapse-border/40 bg-synapse-surface-1/30 space-y-3 text-left transition-all duration-300 hover:border-synapse-border/80"
                  >
                    <div className={`p-2 rounded w-fit bg-synapse-surface-2 ${cap.color}`}>
                      <IconComponent size={16} />
                    </div>
                    <h3 className="font-sans font-bold text-sm text-synapse-text-primary">{cap.title}</h3>
                    <p className="font-sans text-[11px] text-synapse-text-secondary leading-relaxed">{cap.desc}</p>
                  </motion.div>
                );
              })}
            </div>

          </motion.div>
          
        </Container>
      </main>

      {/* Footer Trust Indicators */}
      <footer className="w-full max-w-6xl mx-auto z-10 select-none border-t border-synapse-border/40 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="font-mono text-[9px] uppercase tracking-wider text-synapse-text-muted">
          SYNAPSE CORE TELEMETRY SYNCED
        </span>
        <div className="flex gap-4 font-mono text-[9px] text-synapse-text-muted">
          <span>CURRICULUM AWARE</span>
          <span>&bull;</span>
          <span>REAL-TIME EVALUATION</span>
        </div>
      </footer>

    </div>
  );
}
