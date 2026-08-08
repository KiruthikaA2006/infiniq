"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import Container from "@/components/layout/Container";
import TheCore from "@/components/core/TheCore";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import Divider from "@/components/ui/Divider";
import { CinematicHeading, SectionHeading, BodyText, DevLabel } from "@/components/ui/Typography";
import { CoreState } from "@/types/core";
import { BookOpen, Layers, CheckCircle2, ChevronRight, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CandidateBrief() {
  const [coreState, setCoreState] = useState<CoreState>("understanding");
  const [isStarting, setIsStarting] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const router = useRouter();

  const handleStartInterview = () => {
    setIsStarting(true);
    setCoreState("listening");
    
    // Simulate navigation/launch delay
    setTimeout(() => {
      setIsStarting(false);
      router.push("/interview");
    }, 2000);
  };

  // Staggered entrance animation definitions
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
      },
    },
  };

  const coreVariants = {
    hidden: { opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring" as const, stiffness: 60, damping: 20 },
    },
  };

  const elementVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 80, damping: 20 },
    },
  };

  return (
    <div className="min-h-screen bg-infiniq-bg text-infiniq-text-primary scientific-grid py-12 px-6 flex flex-col justify-between relative overflow-hidden">
      
      {/* Top micro header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between z-10 select-none mb-4">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-wider text-infiniq-text-muted hover:text-infiniq-text-primary transition-colors infiniq-focus"
          aria-label="Return to landing page"
        >
          &larr; Back
        </Link>
        <DevLabel>Briefing Dossier</DevLabel>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex items-center justify-center py-6 z-10">
        <Container isMobileLocked={true} className="flex flex-col items-center">
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="w-full space-y-6"
          >
            {/* 1. Core AI Indicator Section */}
            <motion.div variants={coreVariants} className="flex flex-col items-center">
              <TheCore state={coreState} className="w-40 h-40" />
              
              <motion.div 
                variants={elementVariants}
                className="mt-3 flex flex-col items-center space-y-1"
              >
                <Badge variant={isStarting ? "indigo" : "emerald"} showDot>
                  {isStarting ? "Listening" : "Analysis Complete"}
                </Badge>
                <span className="font-mono text-[9px] tracking-widest text-infiniq-text-muted/60 uppercase">
                  Telemetry synched
                </span>
              </motion.div>
            </motion.div>

            {/* 2. Candidate Identity */}
            <motion.div variants={elementVariants} className="text-center space-y-1">
              <CinematicHeading className="text-2xl sm:text-2xl font-normal text-infiniq-text-primary">
                Gokul Nathan
              </CinematicHeading>
              <DevLabel className="text-infiniq-indigo">
                AI Engineering Candidate
              </DevLabel>
            </motion.div>

            <Divider />

            {/* 3. Learning Journey Section */}
            <motion.div variants={elementVariants} className="space-y-2">
              <div className="flex justify-between items-end font-mono text-[10px] uppercase tracking-wider text-infiniq-text-muted">
                <span>Completed Learning</span>
                <span className="text-infiniq-text-primary font-semibold">24 / 31 Days</span>
              </div>
              <Progress value={(24 / 31) * 100} showValue={false} />
            </motion.div>

            {/* 4. Technical Profile Strengths & Growths */}
            <motion.div variants={elementVariants} className="grid grid-cols-1 gap-4">
              {/* Strengths */}
              <div className="space-y-2">
                <DevLabel className="text-emerald-400">Strength Areas</DevLabel>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="slate" className="bg-infiniq-surface-2 border-infiniq-border">
                    RAG
                  </Badge>
                  <Badge variant="slate" className="bg-infiniq-surface-2 border-infiniq-border">
                    Vector Databases
                  </Badge>
                  <Badge variant="slate" className="bg-infiniq-surface-2 border-infiniq-border">
                    Prompt Engineering
                  </Badge>
                </div>
              </div>

              {/* Growth Areas */}
              <div className="space-y-2">
                <DevLabel className="text-amber-400">Growth Areas</DevLabel>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="slate" className="bg-infiniq-surface-2 border-infiniq-border text-infiniq-text-muted">
                    MCP
                  </Badge>
                  <Badge variant="slate" className="bg-infiniq-surface-2 border-infiniq-border text-infiniq-text-muted">
                    AI Deployment
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* 5. InfiniQ AI Observation Box */}
            <motion.div
              variants={elementVariants}
              className="p-4 rounded-md border border-infiniq-border bg-infiniq-surface-1/50 border-l-infiniq-indigo/40 border-l-2 relative overflow-hidden"
            >
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1 h-1 rounded-full bg-infiniq-indigo animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-infiniq-indigo font-bold">
                  InfiniQ Observation
                </span>
              </div>
              <p className="font-mono text-[11px] leading-[1.5] text-infiniq-text-secondary text-left">
                &ldquo;Your learning journey shows strong retrieval system understanding. The AI Interviewer will explore architecture decisions and engineering trade-offs.&rdquo;
              </p>
            </motion.div>

            {/* 6. Interviewer Plan Parameters */}
            <motion.div
              variants={elementVariants}
              className="grid grid-cols-3 gap-2 border border-infiniq-border/45 rounded-md p-3 bg-infiniq-surface-1/25 font-mono"
            >
              <div className="text-center space-y-0.5 border-r border-infiniq-border/40">
                <span className="block text-xs font-semibold text-infiniq-text-primary">8</span>
                <span className="block text-[8px] text-infiniq-text-muted uppercase tracking-tight">Questions</span>
              </div>
              <div className="text-center space-y-0.5 border-r border-infiniq-border/40">
                <span className="block text-xs font-semibold text-infiniq-text-primary">4</span>
                <span className="block text-[8px] text-infiniq-text-muted uppercase tracking-tight">Domains</span>
              </div>
              <div className="text-center space-y-0.5">
                <span className="block text-[10px] font-semibold text-infiniq-indigo">Active</span>
                <span className="block text-[8px] text-infiniq-text-muted uppercase tracking-tight">Adaptive</span>
              </div>
            </motion.div>

            {/* 7. Action CTA Button */}
            <motion.div variants={elementVariants} className="pt-2 text-center">
              <Button
                variant={isStarting ? "primary" : "secondary"}
                onClick={handleStartInterview}
                className="w-full h-11"
                disabled={isStarting}
                aria-live="polite"
              >
                {isStarting ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f8fafc] animate-pulse mr-2" />
                    Opening Feed...
                  </>
                ) : (
                  <>
                    Start AI Interviewer
                    <ChevronRight size={14} className="ml-1" />
                  </>
                )}
              </Button>
            </motion.div>

          </motion.div>
          
        </Container>
      </main>

      {/* Subtle bottom info text */}
      <footer className="w-full max-w-[390px] mx-auto text-center z-10 pt-4 border-t border-infiniq-border/20">
        <span className="font-mono text-[9px] text-infiniq-text-muted uppercase tracking-widest">
          Secure Sandbox Session &bull; TLS 1.3
        </span>
      </footer>

    </div>
  );
}
