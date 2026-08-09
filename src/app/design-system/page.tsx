"use client";

import React, { useState } from "react";
import Container from "@/components/layout/Container";
import Navbar from "@/components/layout/Navbar";
import TheCore from "@/components/core/TheCore";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Divider from "@/components/ui/Divider";
import Progress from "@/components/ui/Progress";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { CinematicHeading, SectionHeading, BodyText, DevLabel } from "@/components/ui/Typography";
import { CoreState } from "@/types/core";
import { Info, Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function DesignSystemPreview() {
  const [coreState, setCoreState] = useState<CoreState>("idle");
  const [progressVal, setProgressVal] = useState<number>(65);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);

  const statesList: CoreState[] = ["idle", "listening", "thinking", "understanding", "complete"];

  return (
    <div className="min-h-screen bg-infiniq-bg text-infiniq-text-primary calm-grid flex flex-col justify-between">
      <Navbar />

      <main className="flex-grow py-10">
        <Container size="xl" className="space-y-10">
          
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-infiniq-border/40 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={16} className="text-infiniq-accent" />
                <DevLabel>DESIGN FOUNDATION SPECIFICATIONS</DevLabel>
              </div>
              <CinematicHeading>InfiniQ Design System</CinematicHeading>
              <p className="text-xs text-infiniq-text-muted mt-1 font-mono">
                Warm Dark Visual System (#080907 / #D7CE83) &bull; Editorial Developer Platform
              </p>
            </div>
            <Badge variant="olive" className="text-[10px]">
              VERSION 2.0 PRODUCTION SPEC
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Color Tokens & Core Controller */}
            <div className="col-span-1 lg:col-span-4 space-y-6">
              
              {/* Color Swatches */}
              <div className="p-5 rounded-xl border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-4">
                <DevLabel>COLOR SYSTEM PALETTE</DevLabel>
                <div className="space-y-2 font-mono text-xs">
                  {[
                    { name: "Primary Canvas", hex: "#080907", bg: "bg-[#080907]", border: true },
                    { name: "Secondary Surface", hex: "#0D0E0B", bg: "bg-[#0D0E0B]", border: true },
                    { name: "Surface Card", hex: "#12130F", bg: "bg-[#12130F]", border: true },
                    { name: "Warm Accent", hex: "#D7CE83", bg: "bg-[#D7CE83]" },
                    { name: "Olive Accent", hex: "#AFA75F", bg: "bg-[#AFA75F]" },
                    { name: "Success", hex: "#A8C68A", bg: "bg-[#A8C68A]" },
                    { name: "Warning", hex: "#D6B56D", bg: "bg-[#D6B56D]" },
                    { name: "Error", hex: "#C77C72", bg: "bg-[#C77C72]" },
                  ].map((c) => (
                    <div key={c.name} className="flex items-center justify-between p-2 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-4 h-4 rounded ${c.bg} ${c.border ? 'border border-infiniq-border' : ''}`} />
                        <span className="text-[11px] text-infiniq-text-secondary">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-infiniq-text-muted">{c.hex}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* The Core State Controller */}
              <div className="p-5 rounded-xl border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-4">
                <DevLabel>THE CORE STATE CONTROLLER</DevLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                  {statesList.map((st) => (
                    <Button
                      key={st}
                      variant={coreState === st ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setCoreState(st)}
                      className="font-mono text-[10px] justify-center capitalize"
                    >
                      {st}
                    </Button>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Column: Components Sandbox */}
            <div className="col-span-1 lg:col-span-8 space-y-6">
              
              {/* Interactive Core Preview */}
              <div className="p-6 rounded-xl border border-infiniq-border/60 bg-infiniq-surface-1/40 flex flex-col items-center justify-center">
                <TheCore state={coreState} className="w-52 h-52 mb-2" />
                <StatusIndicator state={coreState} className="mt-2" />
              </div>

              {/* Typography Scale */}
              <div className="p-6 rounded-xl border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-4">
                <DevLabel>TYPOGRAPHY SCALE</DevLabel>
                <div className="space-y-3">
                  <div>
                    <span className="font-mono text-[9px] text-infiniq-text-muted block">Cinematic Heading (Inter Light)</span>
                    <CinematicHeading className="mt-0.5">Understand engineering thinking.</CinematicHeading>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-infiniq-text-muted block">Section Heading (Inter Medium)</span>
                    <SectionHeading className="mt-0.5">Adaptive Questioning Engine</SectionHeading>
                  </div>
                  <div>
                    <span className="font-mono text-[9px] text-infiniq-text-muted block">Body Text</span>
                    <BodyText className="mt-0.5">
                      InfiniQ studies candidate background, evaluates structural trade-offs, and adjusts difficulty in real time.
                    </BodyText>
                  </div>
                </div>
              </div>

              {/* Buttons & Badges */}
              <div className="p-6 rounded-xl border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-5">
                <DevLabel>BUTTONS & BADGES</DevLabel>
                
                <div className="flex flex-wrap gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary Action</Button>
                  <Button variant="ghost">Ghost Action</Button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="accent" showDot>Active Node</Badge>
                  <Badge variant="olive" showDot>Telemetry Sync</Badge>
                  <Badge variant="emerald" showDot>Healthy</Badge>
                  <Badge variant="amber" showDot>Evaluating</Badge>
                  <Badge variant="rose" showDot>Interrupted</Badge>
                  <Badge variant="slate">v1.2.0-spec</Badge>
                </div>
              </div>

              {/* Progress & State Modals */}
              <div className="p-6 rounded-xl border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-5">
                <DevLabel>PROGRESS & STATES</DevLabel>
                
                <div className="space-y-3">
                  <Progress value={progressVal} label="Adaptive Engine Calibrating" />
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setProgressVal((p) => Math.max(0, p - 20))}
                    >
                      - 20%
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setProgressVal((p) => Math.min(100, p + 20))}
                    >
                      + 20%
                    </Button>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    variant={isLoading ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      setIsLoading(!isLoading);
                      setShowError(false);
                    }}
                  >
                    {isLoading ? "Dismiss Loader" : "Preview Loading State"}
                  </Button>
                  <Button
                    variant={showError ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => {
                      setShowError(!showError);
                      setIsLoading(false);
                    }}
                  >
                    {showError ? "Dismiss Error" : "Preview Error State"}
                  </Button>
                </div>

                {isLoading && <LoadingState label="Synthesizing candidate dossier..." />}
                {showError && <ErrorState onRetry={() => setShowError(false)} />}
              </div>

            </div>

          </div>

        </Container>
      </main>

      <footer className="w-full border-t border-infiniq-border/40 bg-infiniq-bg-secondary py-6">
        <Container size="xl" className="flex items-center justify-between font-mono text-[9px] text-infiniq-text-muted">
          <span>INFINIQ SYSTEM DESIGN SPECIFICATION</span>
          <span>CALM INTELLIGENCE</span>
        </Container>
      </footer>
    </div>
  );
}
