"use client";

import React, { useState, useEffect } from "react";
import Sidebar, { SidebarTab } from "@/components/layout/Sidebar";
import Button from "@/components/ui/Button";
import { Printer, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StandaloneBriefPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SidebarTab>("briefing");
  const [candidate, setCandidate] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/candidates");
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) setCandidate(data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const handleStart = () => {
    router.push("/interview?tab=chamber");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-infiniq-bg text-infiniq-text-primary flex flex-col lg:flex-row selection:bg-infiniq-accent/20 selection:text-infiniq-accent-highlight">
      <Sidebar
        activeTab="candidates"
        onTabChange={(tab) => {
          if (tab === "candidates") router.push("/interview?tab=candidates");
          else router.push(`/interview?tab=${tab}`);
        }}
      />

      <div className="flex-grow p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full text-left">
        
        {/* Header & Print Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-infiniq-border/40 pb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-infiniq-text-primary tracking-tight">
              Interview Briefing
            </h1>
            <p className="text-xs text-infiniq-text-secondary mt-0.5">
              InfiniQ has prepared based on the candidate&apos;s background.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrint}
            className="text-xs h-8 px-3"
          >
            <Printer size={12} className="mr-1.5 text-infiniq-text-muted" />
            Print Briefing
          </Button>
        </div>

        {/* Candidate Identity Card */}
        <div className="p-6 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-infiniq-surface-2 border border-infiniq-accent/40 flex items-center justify-center text-sm font-bold text-infiniq-accent flex-shrink-0">
              PN
            </div>
            <div>
              <h2 className="font-sans font-semibold text-lg text-infiniq-text-primary">
                {candidate?.member.name || "Priya Nair"}
              </h2>
              <p className="font-sans text-xs text-infiniq-text-secondary">
                {candidate?.member.jobRole || "Frontend Developer"}
              </p>
              <p className="font-mono text-[10px] text-infiniq-text-muted mt-0.5">
                {candidate?.member.yearsExperience || 1.8} YOE &bull; {candidate?.member.education || "B.Sc CS"}
              </p>
            </div>
          </div>

          {/* 4 Stat Badges */}
          <div className="grid grid-cols-4 gap-3 sm:gap-5 w-full md:w-auto font-mono text-center">
            <div className="p-2.5 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30 min-w-[65px]">
              <span className="font-sans text-xl font-bold text-infiniq-text-primary block">
                {candidate?.missions.missionsCompleted || 20}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                Completed
              </span>
            </div>
            <div className="p-2.5 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30 min-w-[65px]">
              <span className="font-sans text-xl font-bold text-infiniq-error block">
                {candidate?.missions.failedMissions?.length || 4}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                Failed
              </span>
            </div>
            <div className="p-2.5 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30 min-w-[65px]">
              <span className="font-sans text-xl font-bold text-infiniq-text-primary block">
                {candidate?.missions.skippedMissions?.length || 7}
              </span>
              <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                Skipped
              </span>
            </div>
            <div className="p-2.5 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30 min-w-[75px] flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-infiniq-accent/50 flex items-center justify-center mb-0.5">
                <span className="font-mono text-[10px] font-bold text-infiniq-accent">64%</span>
              </div>
              <span className="text-[8px] uppercase tracking-wider text-infiniq-text-muted block">
                First Try Rate
              </span>
            </div>
          </div>
        </div>

        {/* 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-4">
            <div className="space-y-1.5">
              <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                Experience Summary
              </h3>
              <p className="font-sans text-xs text-infiniq-text-secondary leading-relaxed">
                1.8 years in frontend development with strong focus on building responsive web applications and intuitive UI.
              </p>
            </div>
            <div className="pt-3 border-t border-infiniq-border/30 space-y-1">
              <span className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider block">
                Education
              </span>
              <span className="font-mono text-xs text-infiniq-text-secondary block">
                B.Sc Computer Science
              </span>
            </div>
          </div>

          <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
            <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
              Top Strengths
            </h3>
            <ul className="space-y-2 text-xs text-infiniq-text-secondary">
              <li className="flex items-start gap-1.5"><span className="text-infiniq-accent font-bold">&bull;</span> UI/UX Implementation</li>
              <li className="flex items-start gap-1.5"><span className="text-infiniq-accent font-bold">&bull;</span> JavaScript (ES6+)</li>
              <li className="flex items-start gap-1.5"><span className="text-infiniq-accent font-bold">&bull;</span> React Basics</li>
              <li className="flex items-start gap-1.5"><span className="text-infiniq-accent font-bold">&bull;</span> Responsive Design</li>
            </ul>
          </div>

          <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
            <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
              Areas Worth Probing
            </h3>
            <ul className="space-y-2 text-xs text-infiniq-text-secondary">
              <li className="flex items-start gap-1.5"><span className="text-infiniq-warning font-bold">&bull;</span> Advanced React Patterns</li>
              <li className="flex items-start gap-1.5"><span className="text-infiniq-warning font-bold">&bull;</span> State Management</li>
              <li className="flex items-start gap-1.5"><span className="text-infiniq-warning font-bold">&bull;</span> Performance Optimization</li>
              <li className="flex items-start gap-1.5"><span className="text-infiniq-warning font-bold">&bull;</span> System Design Basics</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="p-4 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-sans text-xs font-medium text-infiniq-text-primary">
              Suggested Interview Difficulty:
            </span>
            <span className="font-mono text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded bg-infiniq-surface-2 border border-infiniq-border text-infiniq-text-secondary">
              Medium
            </span>
            <span className="hidden md:inline font-mono text-[10px] text-infiniq-text-muted">
              Based on your learning signals and mission performance.
            </span>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleStart}
            className="w-full sm:w-auto px-6 h-10 text-xs font-semibold"
          >
            Start Interview
          </Button>
        </div>

      </div>
    </div>
  );
}
