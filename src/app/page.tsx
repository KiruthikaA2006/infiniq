"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandLogo from "@/components/ui/BrandLogo";
import TheCore from "@/components/core/TheCore";
import Button from "@/components/ui/Button";
import {
  ArrowRight,
  Cpu,
  GitBranch,
  Target,
  FileCheck2,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Users
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  const capabilities = [
    {
      title: "Adaptive Interviews",
      icon: Cpu,
    },
    {
      title: "Intelligent Follow-ups",
      icon: GitBranch,
    },
    {
      title: "Real-time Evaluation",
      icon: Target,
    },
    {
      title: "Actionable Feedback",
      icon: FileCheck2,
    },
  ];

  return (
    <div className="min-h-screen bg-infiniq-bg text-infiniq-text-primary calm-grid flex flex-col justify-between selection:bg-infiniq-accent/20 selection:text-infiniq-accent-highlight">
      
      {/* Top Header Navigation (Exact Reference Match) */}
      <header className="w-full z-30 border-b border-infiniq-border/40 bg-infiniq-bg/85 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand Wordmark with Sunburst */}
          <BrandLogo size="md" />

          {/* Right: Start Interview CTA */}
          <div className="flex items-center gap-3">
            <Link href="/interview">
              <Button
                variant="primary"
                size="sm"
                className="rounded-full px-4 py-1.5 text-xs font-semibold"
              >
                Start Interview
              </Button>
            </Link>
          </div>

        </div>
      </header>

      {/* Main Hero Section (Dense, Exact Reference Match) */}
      <main className="flex-grow w-full py-8 sm:py-12 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Two-Column Hero Composition */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT HERO: Headline, Subtitle, CTAs */}
            <div className="col-span-1 lg:col-span-7 space-y-6 text-left">
              
              {/* Eyebrow Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-infiniq-surface-2 border border-infiniq-border/80 font-mono text-[9px] uppercase tracking-widest text-infiniq-accent">
                <Sparkles size={11} className="text-infiniq-accent" />
                AI INTERVIEWER PLATFORM
              </div>

              {/* Exact 3-Line Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-light tracking-tight text-infiniq-text-primary leading-[1.12]">
                The AI Interviewer<br />
                That Understands<br />
                <span className="text-infiniq-accent font-normal">
                  Your Journey.
                </span>
              </h1>

              {/* Exact Subtitle */}
              <p className="max-w-lg text-sm sm:text-base text-infiniq-text-secondary leading-relaxed font-normal">
                InfiniQ conducts personalized technical interviews based on your background, learning history and real understanding.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-1">
                <Link href="/interview">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto min-w-[170px] h-11 text-xs font-semibold rounded-md justify-center"
                  >
                    Start Interview
                  </Button>
                </Link>
                <Link href="/interview?tab=briefing">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full sm:w-auto min-w-[130px] h-11 text-xs rounded-md justify-center"
                  >
                    View Demo
                  </Button>
                </Link>
              </div>

            </div>

            {/* RIGHT HERO: Glowing Golden Filament Sphere The Core */}
            <div className="col-span-1 lg:col-span-5 flex items-center justify-center">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-square flex items-center justify-center">
                <TheCore state="idle" className="w-full h-full" />
              </div>
            </div>

          </div>

          {/* Four Capability Cards in a Row (Exact Reference Match) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {capabilities.map((cap, idx) => {
              const Icon = cap.icon;
              return (
                <div
                  key={idx}
                  className="p-4 sm:p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 hover:bg-infiniq-surface-1/70 hover:border-infiniq-accent/30 transition-all duration-200 flex items-center gap-3.5"
                >
                  {/* Golden wireframe icon box */}
                  <div className="w-9 h-9 rounded-md bg-infiniq-surface-2 border border-infiniq-accent/30 flex items-center justify-center text-infiniq-accent flex-shrink-0">
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <span className="font-sans font-medium text-xs sm:text-sm text-infiniq-text-primary">
                    {cap.title}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quick Hub Navigation Cards */}
          <div className="border-t border-infiniq-border/40 pt-8 space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-infiniq-text-muted">
              <span>EXPLORE PLATFORM MODULES</span>
              <span className="text-infiniq-accent">6 REFERENCE PANELS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/interview?tab=candidates"
                className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/30 hover:border-infiniq-accent/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-infiniq-text-primary">
                  <span>1. Candidates Workspace</span>
                  <ChevronRight size={14} className="text-infiniq-accent" />
                </div>
                <p className="text-[11px] text-infiniq-text-secondary font-mono">
                  Browse 20 candidate profiles with mission completion stats & signals.
                </p>
              </Link>

              <Link
                href="/interview?tab=briefing"
                className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/30 hover:border-infiniq-accent/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-infiniq-text-primary">
                  <span>2. Interview Briefing Dossier</span>
                  <ChevronRight size={14} className="text-infiniq-accent" />
                </div>
                <p className="text-[11px] text-infiniq-text-secondary font-mono">
                  Review candidate 4-stat dossier, experience, strengths, and probe areas.
                </p>
              </Link>

              <Link
                href="/interview?tab=chamber"
                className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/30 hover:border-infiniq-accent/40 transition-colors space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-semibold text-infiniq-text-primary">
                  <span>3. Active Interview Chamber</span>
                  <ChevronRight size={14} className="text-infiniq-accent" />
                </div>
                <p className="text-[11px] text-infiniq-text-secondary font-mono">
                  Live 70/30 technical interview workspace with waveform & real-time signals.
                </p>
              </Link>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-infiniq-border/40 bg-infiniq-bg-secondary py-6 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[9px] text-infiniq-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-infiniq-text-secondary">INFINIQ</span>
            <span>&bull;</span>
            <span>AI TECHNICAL INTERVIEWER PLATFORM</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/design-system" className="hover:text-infiniq-accent transition-colors">
              System Specs
            </Link>
            <span>&bull;</span>
            <span>TLS 1.3</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
