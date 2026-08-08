"use client";

import React, { useState } from "react";
import Container from "@/components/layout/Container";
import TheCore from "@/components/core/TheCore";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Divider from "@/components/ui/Divider";
import Progress from "@/components/ui/Progress";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { CinematicHeading, SectionHeading, BodyText, DevLabel } from "@/components/ui/Typography";
import { CoreState } from "@/types/core";
import { Eye, Info, Sparkles, Smartphone, ShieldCheck, Zap } from "lucide-react";

export default function DesignSystemPreview() {
  const [coreState, setCoreState] = useState<CoreState>("idle");
  const [progressVal, setProgressVal] = useState<number>(45);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const [deviceBound, setDeviceBound] = useState<boolean>(true);

  // Cycle states of the core
  const statesList: CoreState[] = ["idle", "listening", "thinking", "understanding", "complete"];

  return (
    <div className="min-h-screen bg-synapse-bg text-synapse-text-primary scientific-grid py-12 px-4 selection:bg-synapse-indigo/30 selection:text-white">
      {/* Page Header (Descriptive branding, clean top bar) */}
      <div className="max-w-4xl mx-auto mb-10 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center border-b border-synapse-border pb-6 gap-4">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            <Sparkles size={16} className="text-synapse-indigo" />
            <DevLabel>Design Foundation</DevLabel>
          </div>
          <CinematicHeading>Synapse Design System</CinematicHeading>
          <p className="text-xs text-synapse-text-muted mt-1 font-mono">
            Platform codename: &ldquo;Calm Intelligence&rdquo; &bull; Mobile-First Validation
          </p>
        </div>

        {/* View toggle (desktop or locked 390px mobile) */}
        <div className="flex gap-2">
          <Button
            variant={deviceBound ? "primary" : "ghost"}
            size="sm"
            onClick={() => setDeviceBound(true)}
            aria-label="Lock view to 390px mobile viewport"
          >
            <Smartphone size={14} className="mr-1.5" />
            390px Mobile
          </Button>
          <Button
            variant={!deviceBound ? "primary" : "ghost"}
            size="sm"
            onClick={() => setDeviceBound(false)}
            aria-label="Expand viewport to full screen container width"
          >
            Full Width
          </Button>
        </div>
      </div>

      {/* Main Sandbox Layout */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Controls and explanation (only visible or prominent on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-5 rounded-lg border border-synapse-border bg-synapse-surface-1">
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} className="text-synapse-indigo" />
              <SectionHeading className="text-sm font-semibold font-mono uppercase tracking-wider">
                System Philosophy
              </SectionHeading>
            </div>
            <BodyText className="text-xs text-synapse-text-secondary leading-relaxed">
              Every detail is tailored to represent scientific, calm, and invisible intelligence. 
              The Core is not a glowing avatar, but an active vector representation of calculations.
            </BodyText>
            
            <Divider className="my-4" label="Accessibility Notes" />
            
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-synapse-text-muted">
                  <strong>Contrast Standards:</strong> High contrast values compliant with WCAG rules against matte surfaces.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Zap size={14} className="text-synapse-indigo mt-0.5 flex-shrink-0" />
                <p className="text-xs text-synapse-text-muted">
                  <strong>Reduced Motion:</strong> Concentric animations adapt automatically if system prefers-reduced-motion is active.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Core Controller */}
          <div className="p-5 rounded-lg border border-synapse-border bg-synapse-surface-1 space-y-4">
            <DevLabel>Orb State Controller</DevLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
              {statesList.map((st) => (
                <Button
                  key={st}
                  variant={coreState === st ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setCoreState(st)}
                  className="font-mono text-[10px]"
                >
                  {st}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The 390px Mock Device Interface (Target for design confirmation) */}
        <div className="lg:col-span-8 flex justify-center">
          <div
            className={`transition-all duration-300 w-full ${
              deviceBound
                ? "max-w-[390px] border border-synapse-border rounded-[32px] p-6 bg-synapse-surface-1 shadow-[0_12px_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
                : "max-w-xl border-0 bg-transparent p-0"
            }`}
          >
            {deviceBound && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-5 rounded-full bg-black/60 z-20 flex items-center justify-center border border-white/5">
                <span className="w-1.5 h-1.5 rounded-full bg-synapse-indigo/60 mr-2" />
                <span className="text-[9px] font-mono text-synapse-text-muted">Synapse Mobile OS</span>
              </div>
            )}

            <Container isMobileLocked={deviceBound} className={deviceBound ? "pt-4" : ""}>
              {/* Core state demo */}
              <div className="flex flex-col items-center justify-center py-6">
                <TheCore state={coreState} className="mb-2" />
                <StatusIndicator state={coreState} className="mt-2" />
              </div>

              <Divider className="my-6" label="Typography Scale" />

              <div className="space-y-4">
                <div>
                  <DevLabel>Cinematic Heading (30px / 0.1em)</DevLabel>
                  <CinematicHeading className="mt-1">Calm Intelligence</CinematicHeading>
                </div>
                <div>
                  <DevLabel>Section Heading (18px)</DevLabel>
                  <SectionHeading className="mt-1">Neural Integration Model</SectionHeading>
                </div>
                <div>
                  <DevLabel>Body Copy (14px)</DevLabel>
                  <BodyText className="mt-1">
                    The platform evaluates complex responses and generates structured assessments using deep semantic pathways.
                  </BodyText>
                </div>
              </div>

              <Divider className="my-6" label="Buttons & Interactive States" />

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="primary">Primary Action</Button>
                  <Button variant="secondary">Secondary</Button>
                </div>
                <Button variant="ghost" size="sm">
                  Ghost / Auxiliary Button
                </Button>
              </div>

              <Divider className="my-6" label="Badges & Metadata" />

              <div className="flex flex-wrap gap-2">
                <Badge variant="indigo" showDot>
                  Active Node
                </Badge>
                <Badge variant="emerald" showDot>
                  Healthy
                </Badge>
                <Badge variant="amber" showDot>
                  Pending
                </Badge>
                <Badge variant="rose" showDot>
                  Error
                </Badge>
                <Badge variant="slate">v1.0.0-dev</Badge>
              </div>

              <Divider className="my-6" label="Progress System" />

              <div className="space-y-4">
                <Progress value={progressVal} label="Semantic Processing" />
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setProgressVal((prev) => Math.max(0, prev - 15))}
                    aria-label="Decrease progress value"
                  >
                    - 15%
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="ml-auto"
                    onClick={() => setProgressVal((prev) => Math.min(100, prev + 15))}
                    aria-label="Increase progress value"
                  >
                    + 15%
                  </Button>
                </div>
              </div>

              <Divider className="my-6" label="State Indicators" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <DevLabel>Toggle Interactive Views:</DevLabel>
                  <div className="flex gap-2">
                    <Button
                      variant={isLoading ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        setIsLoading(!isLoading);
                        setShowError(false);
                      }}
                      className="text-[9px] px-2 py-1"
                    >
                      {isLoading ? "Loaded" : "Load State"}
                    </Button>
                    <Button
                      variant={showError ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => {
                        setShowError(!showError);
                        setIsLoading(false);
                      }}
                      className="text-[9px] px-2 py-1"
                    >
                      {showError ? "Resolved" : "Error State"}
                    </Button>
                  </div>
                </div>

                <div className="transition-all duration-200">
                  {isLoading ? (
                    <LoadingState label="Computing telemetry structures..." />
                  ) : showError ? (
                    <ErrorState
                      title="Evaluation Node Timeout"
                      onRetry={() => {
                        setShowError(false);
                        setIsLoading(true);
                        setTimeout(() => setIsLoading(false), 1200);
                      }}
                    />
                  ) : (
                    <EmptyState
                      title="Telemetry Buffer Clean"
                      description="All evaluation lines are operating inside normal constraints. No action required."
                      actionLabel="Inspect Telemetry"
                      onAction={() => alert("Simulating telemetry inspector connection...")}
                    />
                  )}
                </div>
              </div>

              {/* Footer spacer */}
              <div className="h-8" />
            </Container>
          </div>
        </div>

      </div>
    </div>
  );
}
