"use client";

import React, { useState, useEffect, useRef, useMemo, Suspense } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Sidebar, { SidebarTab } from "@/components/layout/Sidebar";
import TheCore from "@/components/core/TheCore";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Progress from "@/components/ui/Progress";
import BrandLogo from "@/components/ui/BrandLogo";
import InterviewHistoryView from "@/components/history/InterviewHistoryView";
import DashboardView from "@/components/dashboard/DashboardView";
import { CoreState } from "@/types/core";
import { AnsweringState } from "@/types/interview";
import {
  Search,
  ChevronDown,
  ArrowRight,
  Printer,
  Download,
  AlertCircle,
  RefreshCw,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  Lock,
  Flame,
  ChevronRight,
  LogOut,
  Sliders,
  Terminal,
  Activity,
  Layers,
  Award,
  Zap,
  Target,
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu
} from "lucide-react";

const ANALYZING_MESSAGES = [
  "Understanding your reasoning...",
  "Evaluating technical depth...",
  "Checking curriculum context...",
  "Determining next challenge...",
];

export default function InterviewWorkspacePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-infiniq-bg flex items-center justify-center text-xs font-mono text-infiniq-text-muted">Loading Workspace...</div>}>
      <InterviewWorkspaceContent />
    </Suspense>
  );
}

function InterviewWorkspaceContent() {
  const searchParams = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active view tab in the workspace
  const initialTab = (searchParams.get("tab") as SidebarTab) || "candidates";
  const [activeTab, setActiveTab] = useState<SidebarTab>(initialTab);

  // Read ?tab= from URL query params on change
  useEffect(() => {
    const tabParam = searchParams.get("tab") as SidebarTab;
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Candidates Data & Filter States
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Interview Session Orchestration States
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(8);
  const [responseText, setResponseText] = useState("");
  const [currentState, setCurrentState] = useState<AnsweringState>("ready");
  const [coreState, setCoreState] = useState<CoreState>("thinking");
  const [activeSignal, setActiveSignal] = useState<string>("ANALYZING");
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isFollowUp, setIsFollowUp] = useState<boolean>(false);
  const [shortAnswerPrompt, setShortAnswerPrompt] = useState(false);
  const [feedbackReport, setFeedbackReport] = useState<any | null>(null);

  // Interview Timer (MM:SS)
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (activeTab === "chamber" && currentState !== "completed") {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, currentState]);

  const formattedTimer = useMemo(() => {
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [timerSeconds]);

  // Load candidates on mount
  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await fetch("/api/candidates");
        if (!res.ok) throw new Error("Failed to load candidates");
        const data = await res.json();
        setCandidates(data);
        if (data.length > 0 && !selectedCandidate) {
          setSelectedCandidate(data[0]);
        }
      } catch (err) {
        console.error("Error loading candidates:", err);
      } finally {
        setLoadingCandidates(false);
      }
    }
    loadCandidates();
  }, []);

  // Filter candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.member.jobRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === "all" ||
        c.member.jobRole.toLowerCase().includes(roleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [candidates, searchQuery, roleFilter]);

  // Unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    candidates.forEach((c) => roles.add(c.member.jobRole));
    return Array.from(roles);
  }, [candidates]);

  // Keyboard shortcut Ctrl/Cmd + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (activeTab === "chamber" && (currentState === "ready" || currentState === "answering")) {
          e.preventDefault();
          handleSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [responseText, currentState, sessionId, activeTab]);

  const handleSelectCandidateForBriefing = (c: any) => {
    setSelectedCandidate(c);
    setActiveTab("briefing");
  };

  // Begin interview with selected candidate
  const handleBeginInterview = async () => {
    if (!selectedCandidate) return;

    setActiveTab("chamber");
    setCurrentState("thinking");
    setCoreState("thinking");
    setActiveSignal("ANALYZING");
    setValidationError(null);
    setIsFollowUp(false);
    setTimerSeconds(0);

    const generatedSessionId = `session_${Math.random().toString(36).substring(2, 11)}`;
    setSessionId(generatedSessionId);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: generatedSessionId,
          candidate: selectedCandidate,
        }),
      });

      if (!res.ok) throw new Error("Start API call failed");
      const data = await res.json();

      const replyText = data.reply;
      const parts = replyText.split("\n\n");
      const questionContent = parts.slice(1).join("\n\n").replace("First Question: ", "");

      setCurrentQuestionText(questionContent || replyText);
      setQuestionNumber(1);
      setCurrentState("ready");
      setCoreState("listening");
      setActiveSignal("LISTENING");
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 300);
    } catch (err) {
      console.error("Failed to start session:", err);
      setCurrentQuestionText("Explain how you enforce reproducible Python virtual environments and isolate C-extension dependencies across differing host OS architectures.");
      setQuestionNumber(1);
      setCurrentState("ready");
      setCoreState("listening");
      setActiveSignal("LISTENING");
    }
  };

  const handleSubmit = async () => {
    const cleanedText = responseText.trim();

    if (cleanedText === "") {
      setValidationError("Please formulate a detailed technical response to submit.");
      return;
    }

    if (cleanedText.length < 20 && !shortAnswerPrompt) {
      setValidationError("Your response is brief. Could you go one level deeper on that? Please expand on your engineering choices.");
      setShortAnswerPrompt(true);
      setCoreState("listening");
      setActiveSignal("LISTENING");
      return;
    }

    setValidationError(null);
    setShortAnswerPrompt(false);
    setCurrentState("thinking");
    setCoreState("thinking");
    setActiveSignal("SYNTHESIZING");
    setAnalyzingStep(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < ANALYZING_MESSAGES.length) {
        setAnalyzingStep(step);
      }
    }, 800);

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: cleanedText }),
      });

      clearInterval(interval);
      if (!res.ok) throw new Error("Respond API call failed");

      const data = await res.json();

      setCurrentState("next-question");
      setCoreState("understanding");

      setTimeout(() => {
        if (data.done) {
          setCurrentState("completed");
          setCoreState("complete");
          setActiveSignal("COMPLETE");
          setFeedbackReport(data.feedback);

          // Save completed session to local storage for persistent history
          try {
            const completedSession = {
              id: sessionId || `session_${Date.now()}`,
              candidateId: selectedCandidate?.id || "CAND",
              candidate: selectedCandidate,
              startedAt: new Date().toISOString(),
              questionCount: 8,
              maxQuestions: 8,
              status: "completed",
              coveredTopics: data.coveredTopics || ["System Architecture"],
              coveredDays: data.coveredDays || [1, 2, 3, 16],
              strengths: data.feedback?.strengths || ["System Architecture"],
              weaknesses: data.feedback?.gaps || [],
              difficulty: "hard",
              decisions: data.decisions || [],
              finalFeedback: data.feedback,
            };
            const existing = JSON.parse(localStorage.getItem("infiniq_local_sessions") || "[]");
            localStorage.setItem("infiniq_local_sessions", JSON.stringify([completedSession, ...existing]));
          } catch (e) {
            console.warn("Could not save to localStorage:", e);
          }

          setActiveTab("assessment");
        } else {
          const lastDecision = data.decisions?.[data.decisions.length - 1];
          if (lastDecision?.type === "FOLLOW_UP") {
            setIsFollowUp(true);
            setActiveSignal("FOLLOW-UP");
          } else if (lastDecision?.type === "DEEPER_CHALLENGE" || lastDecision?.type === "TRADEOFF_PROBE") {
            setIsFollowUp(true);
            setActiveSignal("DEEPER CHALLENGE");
          } else {
            setIsFollowUp(false);
            setActiveSignal("LISTENING");
          }

          setCurrentQuestionText(data.reply);
          setQuestionNumber((prev) => prev + 1);
          setResponseText("");
          setCurrentState("ready");
          setCoreState("listening");
          setTimeout(() => {
            if (textareaRef.current) textareaRef.current.focus();
          }, 100);
        }
      }, 1100);
    } catch (err) {
      clearInterval(interval);
      console.error("Error submitting response:", err);
      if (questionNumber >= 8) {
        setCurrentState("completed");
        setActiveTab("assessment");
      } else {
        setQuestionNumber((prev) => prev + 1);
        setResponseText("");
        setCurrentState("ready");
        setCoreState("listening");
        setActiveSignal("LISTENING");
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const interviewSignals = [
    "LISTENING",
    "ANALYZING",
    "SYNTHESIZING",
    "FOLLOW-UP",
    "DEEPER CHALLENGE",
  ];

  const getInitials = (name: string) => {
    if (!name) return "IQ";
    const parts = name.split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : parts[0].slice(0, 2).toUpperCase();
  };

  const candidateStats = useMemo(() => {
    if (!selectedCandidate) {
      return { completed: 20, failed: 4, skipped: 7, firstTryRate: 64 };
    }
    const completed = selectedCandidate.missions.missionsCompleted || 20;
    const failed = selectedCandidate.missions.failedMissions?.length || 0;
    const skipped = selectedCandidate.missions.skippedMissions?.length || 0;
    const firstTry = selectedCandidate.missions.firstTryMissions || 15;
    const firstTryRate = completed > 0 ? Math.round((firstTry / completed) * 100) : 64;
    return { completed, failed, skipped, firstTryRate };
  }, [selectedCandidate]);

  const isChamberActive = activeTab === "chamber" || activeTab === "progress";

  return (
    <div className="min-h-screen bg-infiniq-bg text-infiniq-text-primary flex flex-col lg:flex-row selection:bg-infiniq-accent/20 selection:text-infiniq-accent-highlight">
      
      {/* 1. SLIM LEFT SIDEBAR */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isChamberMode={isChamberActive}
      />

      {/* 2. MAIN APPLICATION CONTENT WORKSPACE */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto">
        
        {/* ========================================================================= */}
        {/* TAB: INTERVIEW HISTORY (Full Interactive History View)                    */}
        {/* ========================================================================= */}
        {activeTab === "history" && (
          <InterviewHistoryView
            onStartNewInterview={() => setActiveTab("candidates")}
            onSelectCandidate={(c) => {
              setSelectedCandidate(c);
              setActiveTab("briefing");
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB: DASHBOARD                                                            */}
        {/* ========================================================================= */}
        {activeTab === "dashboard" && (
          <DashboardView
            candidates={candidates}
            selectedCandidate={selectedCandidate}
            onSelectCandidate={(c) => {
              setSelectedCandidate(c);
            }}
            onStartInterview={(c) => {
              setSelectedCandidate(c);
              handleBeginInterview();
            }}
            onNavigate={(tab) => {
              setActiveTab(tab as SidebarTab);
            }}
          />
        )}

        {/* ========================================================================= */}
        {/* TAB: SETTINGS                                                             */}
        {/* ========================================================================= */}
        {activeTab === "settings" && (
          <div className="p-6 lg:p-8 space-y-6 max-w-4xl mx-auto w-full text-left font-sans select-none">
            <div className="border-b border-infiniq-border/40 pb-5">
              <h1 className="text-xl sm:text-2xl font-semibold text-infiniq-text-primary tracking-tight">
                Platform Settings
              </h1>
              <p className="text-xs text-infiniq-text-secondary mt-0.5">
                Manage evaluation parameters, inference runtime, and interviewer engine configurations.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-infiniq-text-primary">
                  Inference Configuration
                </h3>
                <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-infiniq-text-muted block">Provider Mode</span>
                    <span className="text-infiniq-text-primary font-bold">Adaptive Simulation / API</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-infiniq-text-muted block">Validation Schema</span>
                    <span className="text-infiniq-accent font-bold">Zod Strict JSON</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-infiniq-text-primary">
                  Environment Diagnostics
                </h3>
                <div className="space-y-2 font-mono text-xs text-infiniq-text-secondary">
                  <div className="flex items-center justify-between">
                    <span>Candidates Dataset</span>
                    <span className="text-infiniq-success">20 Profiles (Loaded)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Curriculum Schema</span>
                    <span className="text-infiniq-success">31 Days (Loaded)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Port Binding</span>
                    <span className="text-infiniq-accent">8080 (Active)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL 2: CANDIDATES WORKSPACE (Exact Reference Match Top-Right)           */}
        {/* ========================================================================= */}
        {activeTab === "candidates" && (
          <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
            
            {/* Header & Search/Filter Controls */}
            {/* Header & Search / Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-infiniq-border/40 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-infiniq-text-primary tracking-tight">
                  Candidates
                </h1>
                <p className="text-xs text-infiniq-text-secondary mt-0.5">
                  Select a candidate to start a personalized interview.
                </p>
              </div>

              {/* Search input & Filter Dropdown */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                <div className="relative min-w-full sm:min-w-[220px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-infiniq-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search candidates..."
                    className="w-full pl-8 pr-3 py-1.5 bg-infiniq-surface-1 border border-infiniq-border rounded-md text-xs text-infiniq-text-primary placeholder:text-infiniq-text-muted focus:outline-none focus:border-infiniq-accent/50 font-sans infiniq-focus"
                  />
                </div>

                <div className="relative min-w-full sm:min-w-auto">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full appearance-none bg-infiniq-surface-1 border border-infiniq-border rounded-md text-xs text-infiniq-text-secondary pl-3 pr-7 py-1.5 focus:outline-none focus:border-infiniq-accent/50 cursor-pointer font-sans"
                  >
                    <option value="all">All Candidates</option>
                    {uniqueRoles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-infiniq-text-muted pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Candidate Card Grid: 3 columns x 2 rows */}
            {loadingCandidates ? (
              <div className="flex items-center justify-center py-24 text-xs font-mono text-infiniq-text-muted">
                <RefreshCw size={16} className="animate-spin text-infiniq-accent mr-2" />
                Loading candidate datasets...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredCandidates.map((c) => {
                  const completedDays = c.missions.missionsCompleted || 24;
                  const totalDays = 31;
                  const strengths = c.signals.strengthSignals.slice(0, 2);

                  return (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCandidateForBriefing(c)}
                      className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 hover:bg-infiniq-surface-1/80 hover:border-infiniq-accent/40 transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-4 select-none"
                    >
                      {/* Top: Avatar & Candidate identity */}
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-infiniq-surface-2 border border-infiniq-accent/30 flex items-center justify-center text-xs font-bold text-infiniq-accent flex-shrink-0">
                          {getInitials(c.member.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-sans font-semibold text-sm text-infiniq-text-primary truncate">
                            {c.member.name}
                          </h3>
                          <p className="font-sans text-xs text-infiniq-text-secondary truncate">
                            {c.member.jobRole}
                          </p>
                          <p className="font-mono text-[10px] text-infiniq-text-muted mt-0.5 truncate">
                            {c.member.yearsExperience} YOE &bull; {c.member.education}
                          </p>
                        </div>
                      </div>

                      {/* Mid: Missions Completed Progress Line */}
                      <div className="space-y-1 font-mono text-xs">
                        <div className="flex justify-between items-center text-[10px] text-infiniq-text-muted">
                          <span>Missions Completed</span>
                          <span className="text-infiniq-text-primary font-semibold">
                            {completedDays} / {totalDays}
                          </span>
                        </div>
                        <div className="h-[2.5px] w-full rounded-full bg-infiniq-surface-3 overflow-hidden">
                          <div
                            className="h-full bg-infiniq-accent rounded-full"
                            style={{ width: `${(completedDays / totalDays) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom: Top Strengths & View Profile Link */}
                      <div className="flex items-end justify-between pt-1 border-t border-infiniq-border/25">
                        <div className="space-y-1 text-left">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                            Top Strengths
                          </span>
                          <div className="space-y-0.5">
                            {strengths.length > 0 ? (
                              strengths.map((st: string, idx: number) => (
                                <span key={idx} className="font-sans text-[11px] text-infiniq-text-secondary block">
                                  &bull; {st}
                                </span>
                              ))
                            ) : (
                              <span className="font-sans text-[11px] text-infiniq-text-secondary block">
                                &bull; Systems Architecture
                              </span>
                            )}
                          </div>
                        </div>

                        <span className="font-sans text-xs text-infiniq-accent font-medium hover:underline inline-flex items-center gap-0.5">
                          View Profile <span className="text-[10px]">&rarr;</span>
                        </span>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL 3: INTERVIEW BRIEFING DOSSIER                                       */}
        {/* ========================================================================= */}
        {activeTab === "briefing" && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-6xl mx-auto w-full text-left">
            
            {/* Header & Print Briefing Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-infiniq-border/40 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-infiniq-text-primary tracking-tight">
                  Interview Briefing
                </h1>
                <p className="text-xs text-infiniq-text-secondary mt-0.5">
                  InfiniQ has prepared based on the candidate&apos;s background.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePrint}
                  className="w-full sm:w-auto text-xs h-8 px-3"
                >
                  <Printer size={12} className="mr-1.5 text-infiniq-text-muted" />
                  Print Briefing
                </Button>
              </div>
            </div>

            {/* Candidate Identity Card with 4 Stat Badges */}
            <div className="p-4 sm:p-6 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
              
              {/* Identity Details */}
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-infiniq-surface-2 border border-infiniq-accent/40 flex items-center justify-center text-xs sm:text-sm font-bold text-infiniq-accent flex-shrink-0">
                  {getInitials(selectedCandidate?.member.name || "Priya Nair")}
                </div>
                <div>
                  <h2 className="font-sans font-semibold text-base sm:text-lg text-infiniq-text-primary">
                    {selectedCandidate?.member.name || "Priya Nair"}
                  </h2>
                  <p className="font-sans text-xs text-infiniq-text-secondary">
                    {selectedCandidate?.member.jobRole || "Frontend Developer"}
                  </p>
                  <p className="font-mono text-[10px] text-infiniq-text-muted mt-0.5">
                    {selectedCandidate?.member.yearsExperience || 1.8} YOE &bull; {selectedCandidate?.member.education || "B.Sc CS"}
                  </p>
                </div>
              </div>

              {/* 4 Stat Badges (Completed, Failed, Skipped, First Try Rate) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 w-full md:w-auto font-mono text-center">
                <div className="p-2 sm:p-2.5 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30">
                  <span className="font-sans text-lg sm:text-xl font-bold text-infiniq-text-primary block">
                    {candidateStats.completed}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                    Completed
                  </span>
                </div>

                <div className="p-2 sm:p-2.5 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30">
                  <span className="font-sans text-lg sm:text-xl font-bold text-infiniq-error block">
                    {candidateStats.failed}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                    Failed
                  </span>
                </div>

                <div className="p-2 sm:p-2.5 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30">
                  <span className="font-sans text-lg sm:text-xl font-bold text-infiniq-text-primary block">
                    {candidateStats.skipped}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                    Skipped
                  </span>
                </div>

                <div className="p-2 sm:p-2.5 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30 flex flex-col items-center justify-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-infiniq-accent/50 flex items-center justify-center mb-0.5">
                    <span className="font-mono text-[9px] sm:text-[10px] font-bold text-infiniq-accent">
                      {candidateStats.firstTryRate}%
                    </span>
                  </div>
                  <span className="text-[8px] uppercase tracking-wider text-infiniq-text-muted block">
                    First Try Rate
                  </span>
                </div>
              </div>

            </div>

            {/* 3-Column Analysis Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              {/* Column 1: Experience Summary & Education */}
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-4">
                <div className="space-y-1.5">
                  <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                    Experience Summary
                  </h3>
                  <p className="font-sans text-xs text-infiniq-text-secondary leading-relaxed">
                    {selectedCandidate?.member.yearsExperience || 1.8} years in {selectedCandidate?.member.jobRole || "frontend development"} with strong focus on building responsive web applications and intuitive UI.
                  </p>
                </div>

                <div className="pt-3 border-t border-infiniq-border/30 space-y-1">
                  <span className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider block">
                    Education
                  </span>
                  <span className="font-mono text-xs text-infiniq-text-secondary block">
                    {selectedCandidate?.member.education || "B.Sc Computer Science"}
                  </span>
                </div>
              </div>

              {/* Column 2: Top Strengths */}
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
                <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                  Top Strengths
                </h3>
                <ul className="space-y-2 text-xs text-infiniq-text-secondary">
                  {selectedCandidate?.signals.strengthSignals && selectedCandidate.signals.strengthSignals.length > 0 ? (
                    selectedCandidate.signals.strengthSignals.map((s: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-infiniq-accent font-bold">&bull;</span>
                        <span>{s}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5"><span className="text-infiniq-accent font-bold">&bull;</span> UI/UX Implementation</li>
                      <li className="flex items-start gap-1.5"><span className="text-infiniq-accent font-bold">&bull;</span> JavaScript (ES6+)</li>
                      <li className="flex items-start gap-1.5"><span className="text-infiniq-accent font-bold">&bull;</span> React Basics</li>
                      <li className="flex items-start gap-1.5"><span className="text-infiniq-accent font-bold">&bull;</span> Responsive Design</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Column 3: Areas Worth Probing */}
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
                <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                  Areas Worth Probing
                </h3>
                <ul className="space-y-2 text-xs text-infiniq-text-secondary">
                  {selectedCandidate?.signals.weaknessSignals && selectedCandidate.signals.weaknessSignals.length > 0 ? (
                    selectedCandidate.signals.weaknessSignals.map((w: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-infiniq-warning font-bold">&bull;</span>
                        <span>{w}</span>
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-start gap-1.5"><span className="text-infiniq-warning font-bold">&bull;</span> Advanced React Patterns</li>
                      <li className="flex items-start gap-1.5"><span className="text-infiniq-warning font-bold">&bull;</span> State Management</li>
                      <li className="flex items-start gap-1.5"><span className="text-infiniq-warning font-bold">&bull;</span> Performance Optimization</li>
                      <li className="flex items-start gap-1.5"><span className="text-infiniq-warning font-bold">&bull;</span> System Design Basics</li>
                    </>
                  )}
                </ul>
              </div>

            </div>

            {/* Bottom Bar: Suggested Interview Difficulty & Start Interview Button */}
            <div className="p-4 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/60 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-sans text-xs font-medium text-infiniq-text-primary">
                  Suggested Interview Difficulty:
                </span>
                <span className="font-mono text-[10px] uppercase font-semibold px-2.5 py-0.5 rounded bg-infiniq-surface-2 border border-infiniq-border text-infiniq-text-secondary">
                  {selectedCandidate?.signals.confidenceLevel === "high" ? "Advanced" : "Medium"}
                </span>
                <span className="hidden md:inline font-mono text-[10px] text-infiniq-text-muted">
                  Based on candidate signals and learning history.
                </span>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleBeginInterview}
                className="w-full sm:w-auto px-6 h-10 text-xs font-semibold"
              >
                Start Interview
              </Button>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL 4: INTERVIEW CHAMBER                                                */}
        {/* ========================================================================= */}
        {activeTab === "chamber" && (
          <div className="flex flex-col h-full">
            
            {/* Chamber Top Header */}
            <div className="border-b border-infiniq-border/40 bg-infiniq-bg-secondary px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-4 select-none">
              
              {/* Left: Live status & Question Progress */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 w-full sm:w-auto justify-between sm:justify-start">
                <span className="flex items-center gap-2 font-sans text-xs font-medium text-infiniq-text-primary">
                  <span className="w-2 h-2 rounded-full bg-infiniq-success animate-pulse" />
                  Interview in Progress
                </span>

                <div className="flex items-center gap-2 font-mono text-xs text-infiniq-text-secondary">
                  <span>Q{questionNumber} of {totalQuestions}</span>
                  <div className="w-20 sm:w-28 h-[3px] bg-infiniq-surface-3 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-infiniq-accent rounded-full transition-all"
                      style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Live Timer & End Interview Button */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto border-t sm:border-t-0 border-infiniq-border/20 pt-2 sm:pt-0">
                <div className="font-mono text-xs text-infiniq-text-secondary flex items-center gap-1.5">
                  <span className="text-[10px] uppercase text-infiniq-text-muted">Time:</span>
                  <span className="text-infiniq-text-primary font-bold">{formattedTimer}</span>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab("assessment")}
                  className="text-xs h-7 px-2.5 text-infiniq-text-muted hover:text-infiniq-error"
                >
                  <LogOut size={12} className="mr-1" />
                  End Interview
                </Button>
              </div>

            </div>

            {/* Main Chamber Grid */}
            <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 max-w-7xl mx-auto w-full text-left items-start flex-grow">
              
              {/* LEFT WORKSPACE (70%) */}
              <div className="col-span-1 lg:col-span-8 space-y-4 sm:space-y-6">
                
                {/* Question Area Box */}
                <div className="p-4 sm:p-6 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-4 sm:space-y-5">
                  
                  {/* Top: The Core is thinking & ANALYZING status badge */}
                  <div className="flex items-center justify-between border-b border-infiniq-border/25 pb-3">
                    <span className="font-mono text-[10px] text-infiniq-text-muted">
                      The Core is thinking
                    </span>
                    <Badge variant="accent" showDot className="text-[9px]">
                      {activeSignal}
                    </Badge>
                  </div>

                  {/* Core Audio Waveform + Question Text */}
                  <div className="flex items-start gap-3 sm:gap-4 py-1">
                    <div className="font-mono text-xs text-infiniq-accent tracking-tighter select-none mt-1 hidden sm:block flex-shrink-0">
                      -||||-||-
                    </div>
                    <div className="space-y-2 min-w-0">
                      <h2 className="font-sans font-light text-base sm:text-xl md:text-2xl text-infiniq-text-primary leading-snug break-words">
                        {currentQuestionText || "Explain how you enforce reproducible Python virtual environments and isolate C-extension dependencies across differing host OS architectures."}
                      </h2>
                      <p className="font-mono text-[10px] text-infiniq-text-muted">
                        &#10022; Be specific and include a real-world example if possible.
                      </p>
                    </div>
                  </div>

                </div>

                {/* Technical Response Editor */}
                <div className="p-4 sm:p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      rows={6}
                      disabled={currentState === "thinking"}
                      value={responseText}
                      onChange={(e) => {
                        setResponseText(e.target.value);
                        setValidationError(null);
                        if (currentState === "ready") setCurrentState("answering");
                      }}
                      placeholder="Type your answer here..."
                      className="w-full bg-infiniq-bg border border-infiniq-border rounded-md px-3.5 sm:px-4 py-2.5 sm:py-3 font-sans text-xs sm:text-sm text-infiniq-text-primary placeholder:text-infiniq-text-muted/60 focus:outline-none focus:border-infiniq-accent/50 transition-all resize-none leading-relaxed infiniq-focus min-h-[140px]"
                    />
                  </div>

                  {/* Validation Error & Analyzing indicator */}
                  {validationError && (
                    <div className="flex items-center gap-1.5 text-xs text-infiniq-warning font-mono py-1">
                      <AlertCircle size={13} />
                      <span>{validationError}</span>
                    </div>
                  )}

                  {currentState === "thinking" && (
                    <div className="flex items-center gap-2 text-xs font-mono text-infiniq-accent py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-infiniq-accent animate-pulse" />
                      <span>{ANALYZING_MESSAGES[analyzingStep]}</span>
                    </div>
                  )}

                  {/* Bottom bar: Shortcut hint & Submit Answer Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 font-mono text-xs">
                    <span className="text-[10px] text-infiniq-text-muted select-none text-center sm:text-left order-2 sm:order-1">
                      &#9000; Press Ctrl + Enter to submit
                    </span>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleSubmit}
                      disabled={currentState === "thinking" || responseText.trim() === ""}
                      className="w-full sm:w-auto px-5 h-11 sm:h-9 text-xs font-semibold order-1 sm:order-2 active:scale-[0.98]"
                    >
                      {currentState === "thinking" ? "Evaluating..." : "Submit Answer \u2197"}
                    </Button>
                  </div>
                </div>

              </div>

              {/* RIGHT CONTEXT PANEL (30%) */}
              <div className="col-span-1 lg:col-span-4 space-y-4 font-mono text-xs">
                
                {/* InfiniQ Core Active Intelligence Visual */}
                <div className="p-4 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 flex flex-col items-center justify-center space-y-2">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center">
                    <TheCore
                      state={
                        currentState === "thinking"
                          ? "analyzing"
                          : isFollowUp
                          ? "understanding"
                          : currentState === "completed"
                          ? "complete"
                          : "listening"
                      }
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* 1. Interview Signals List */}
                <div className="p-4 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
                  <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block border-b border-infiniq-border/30 pb-1.5">
                    Interview Signals
                  </span>
                  <div className="space-y-1.5">
                    {interviewSignals.map((sig) => {
                      const isActive = activeSignal === sig;
                      return (
                        <div
                          key={sig}
                          className={`flex items-center gap-2 px-2.5 py-1 rounded text-[10px] transition-colors ${
                            isActive
                              ? "bg-infiniq-surface-2 border border-infiniq-accent/40 text-infiniq-accent font-bold"
                              : "text-infiniq-text-muted"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-infiniq-accent animate-pulse" : "bg-infiniq-text-muted/40"}`} />
                          <span>{sig}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Current Focus & Difficulty */}
                <div className="p-4 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                      Current Focus
                    </span>
                    <span className="font-sans font-medium text-xs text-infiniq-text-primary block mt-0.5">
                      System Architecture
                    </span>
                  </div>

                  <div className="pt-2 border-t border-infiniq-border/30 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                        Difficulty
                      </span>
                      <span className="font-sans text-xs text-infiniq-text-secondary block mt-0.5">
                        Advanced
                      </span>
                    </div>
                    <div className="flex items-end gap-1 h-4">
                      <div className="w-1 h-2 bg-infiniq-accent rounded-xs" />
                      <div className="w-1 h-3 bg-infiniq-accent rounded-xs" />
                      <div className="w-1 h-4 bg-infiniq-accent rounded-xs" />
                    </div>
                  </div>
                </div>

                {/* 3. Topics Covered */}
                <div className="p-4 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-2.5">
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                    Topics Covered
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {["Python Environments", "FastAPI", "React SSE", "Vector Search"].map((tag, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-2 py-0.5 rounded bg-infiniq-surface-2 border border-infiniq-border/40 text-infiniq-text-secondary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL 5: INTERVIEW PROGRESS VIEW                                          */}
        {/* ========================================================================= */}
        {activeTab === "progress" && (
          <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full text-left">
            
            <div className="border-b border-infiniq-border/40 pb-5">
              <h1 className="text-xl sm:text-2xl font-semibold text-infiniq-text-primary tracking-tight">
                Interview Progress
              </h1>
              <p className="text-xs text-infiniq-text-secondary mt-0.5">
                Overview of the ongoing interview.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Questions Completed */}
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 flex flex-col justify-between space-y-4">
                <span className="font-mono text-[10px] uppercase tracking-wider text-infiniq-text-muted block">
                  Questions Completed
                </span>
                
                <div className="flex items-center justify-center py-4">
                  <div className="relative w-32 h-32 rounded-full border-4 border-infiniq-surface-3 border-t-infiniq-accent border-r-infiniq-accent flex flex-col items-center justify-center">
                    <span className="font-sans font-light text-2xl text-infiniq-text-primary">
                      {questionNumber}/8
                    </span>
                    <span className="font-mono text-[9px] text-infiniq-text-muted">
                      {Math.round((questionNumber / 8) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-between font-mono text-[10px] text-infiniq-text-muted">
                  <span>Current Challenge: Q{questionNumber}</span>
                  <span>Target: 8 Total</span>
                </div>
              </div>

              {/* Card 2: Curriculum Areas */}
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3 font-mono text-xs">
                <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block border-b border-infiniq-border/30 pb-1.5">
                  Curriculum Areas Covered
                </span>
                
                <div className="space-y-2">
                  {[
                    { day: "Day 01", name: "Python Environments & Tooling", done: true },
                    { day: "Day 02", name: "Local LLM Inference", done: true },
                    { day: "Day 03", name: "FastAPI & Streaming", done: true },
                    { day: "Day 10", name: "Retrieval & Reranking", done: false },
                    { day: "Day 21", name: "LangChain & Agents", done: false },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-infiniq-text-secondary">
                        {item.day} - {item.name}
                      </span>
                      {item.done ? (
                        <Check size={13} className="text-infiniq-accent font-bold" />
                      ) : (
                        <span className="text-infiniq-text-muted">&mdash;</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Performance Trend */}
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-3 font-mono text-xs">
                <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block">
                  Performance Trend
                </span>
                
                <div className="relative pt-2 pb-1">
                  <svg viewBox="0 0 300 100" className="w-full h-24 overflow-visible">
                    <text x="0" y="20" fill="#6F7068" fontSize="8">High</text>
                    <text x="0" y="55" fill="#6F7068" fontSize="8">Medium</text>
                    <text x="0" y="90" fill="#6F7068" fontSize="8">Low</text>
                    
                    <line x1="35" y1="18" x2="295" y2="18" stroke="rgba(221,211,150,0.08)" strokeDasharray="2 4" />
                    <line x1="35" y1="52" x2="295" y2="52" stroke="rgba(221,211,150,0.08)" strokeDasharray="2 4" />
                    <line x1="35" y1="88" x2="295" y2="88" stroke="rgba(221,211,150,0.08)" strokeDasharray="2 4" />

                    <path
                      d="M 50 75 Q 80 40, 115 55 T 180 35 T 245 45 T 285 30"
                      fill="none"
                      stroke="#D7CE83"
                      strokeWidth="2"
                    />

                    {[
                      { x: 50, y: 75, q: "Q1" },
                      { x: 85, y: 50, q: "Q2" },
                      { x: 120, y: 55, q: "Q3" },
                      { x: 155, y: 40, q: "Q4" },
                      { x: 190, y: 35, q: "Q5" },
                      { x: 225, y: 48, q: "Q6" },
                      { x: 260, y: 40, q: "Q7" },
                      { x: 285, y: 30, q: "Q8" },
                    ].map((node, i) => (
                      <g key={i}>
                        <circle cx={node.x} cy={node.y} r="3" fill="#D7CE83" />
                        <text x={node.x - 4} y="98" fill="#6F7068" fontSize="7">{node.q}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Card 4: AI Interviewer Notes */}
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 flex flex-col justify-between space-y-3 font-mono text-xs">
                <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block">
                  AI Interviewer Notes
                </span>
                
                <p className="font-sans text-xs text-infiniq-text-secondary leading-relaxed">
                  Candidate demonstrates solid grasp of platform architecture. Probed on ABI compatibility and concurrency failure modes.
                </p>

                <div className="pt-2 border-t border-infiniq-border/30 flex items-center justify-between text-[10px]">
                  <span className="text-infiniq-text-muted">
                    Next: Microservice telemetry and streaming state management.
                  </span>
                  <Lock size={12} className="text-infiniq-accent" />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* PANEL 6: FINAL ASSESSMENT & REPORTS                                       */}
        {/* ========================================================================= */}
        {(activeTab === "assessment" || activeTab === "reports") && (
          <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto w-full text-left">
            
            {/* Header & Download Report Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-infiniq-border/40 pb-5">
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-infiniq-text-primary tracking-tight">
                  Final Assessment
                </h1>
                <p className="text-xs text-infiniq-text-secondary mt-0.5">
                  Comprehensive feedback and next steps.
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={handlePrint}
                className="text-xs h-8 px-3"
              >
                <Download size={12} className="mr-1.5 text-infiniq-text-muted" />
                Download Report
              </Button>
            </div>

            {/* 3-Column Multi-Panel Scorecard Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              
              {/* LEFT PANEL (Col 4): Overall Assessment */}
              <div className="col-span-1 md:col-span-4 p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-5 font-mono text-xs">
                
                <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block text-center">
                  Overall Assessment
                </span>

                <div className="flex justify-center py-1">
                  <div className="w-24 h-24 rounded-full border-2 border-infiniq-accent/60 flex flex-col items-center justify-center bg-infiniq-surface-2/40">
                    <span className="font-sans text-2xl font-light text-infiniq-accent">
                      {feedbackReport?.grade || (feedbackReport?.averageScore ? (feedbackReport.averageScore >= 85 ? "A" : feedbackReport.averageScore >= 75 ? "A-" : "B+") : "—")}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-widest text-infiniq-text-muted">
                      {feedbackReport?.averageScore ? (feedbackReport.averageScore >= 85 ? "Excellent" : feedbackReport.averageScore >= 70 ? "Proficient" : "Needs Review") : "Complete"}
                    </span>
                  </div>
                </div>

                {/* Score Breakdown horizontal bars */}
                <div className="space-y-3 pt-2 border-t border-infiniq-border/30">
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                    Score Breakdown
                  </span>
                  
                  {[
                    { name: "Technical Depth", val: feedbackReport?.technicalDepth ?? 0 },
                    { name: "Accuracy", val: feedbackReport?.accuracy ?? 0 },
                    { name: "Reasoning", val: feedbackReport?.reasoning ?? 0 },
                    { name: "Relevance", val: feedbackReport?.relevance ?? (feedbackReport?.averageScore ?? 0) },
                    { name: "Communication", val: feedbackReport?.communication ?? 0 },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[10px] text-infiniq-text-secondary">
                        <span>{item.name}</span>
                        <span className="font-bold text-infiniq-text-primary">{item.val}/100</span>
                      </div>
                      <div className="h-[2px] w-full bg-infiniq-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-infiniq-accent rounded-full" style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }} />
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-between text-xs font-bold text-infiniq-text-primary pt-2 border-t border-infiniq-border/20">
                    <span>Overall Score</span>
                    <span className="text-infiniq-accent">
                      {feedbackReport?.averageScore ? `${feedbackReport.averageScore}/100` : "—"}
                    </span>
                  </div>
                </div>

                {/* Response Quality Summary */}
                {feedbackReport?.responseQuality && (
                  <div className="pt-3 border-t border-infiniq-border/30 space-y-2">
                    <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
                      Response Quality
                    </span>
                    <div className="space-y-1 text-[11px] text-infiniq-text-secondary">
                      <div className="flex justify-between">
                        <span>Questions Evaluated:</span>
                        <span className="font-bold text-infiniq-text-primary">{feedbackReport.responseQuality.totalEvaluated}</span>
                      </div>
                      <div className="flex justify-between text-infiniq-success">
                        <span>&bull; Correct:</span>
                        <span className="font-bold">{feedbackReport.responseQuality.correct}</span>
                      </div>
                      <div className="flex justify-between text-infiniq-accent">
                        <span>&bull; Partially Correct:</span>
                        <span className="font-bold">{feedbackReport.responseQuality.partiallyCorrect}</span>
                      </div>
                      {feedbackReport.responseQuality.irrelevant > 0 && (
                        <div className="flex justify-between text-infiniq-error">
                          <span>&bull; Irrelevant:</span>
                          <span className="font-bold">{feedbackReport.responseQuality.irrelevant}</span>
                        </div>
                      )}
                      {feedbackReport.responseQuality.misconceptions > 0 && (
                        <div className="flex justify-between text-infiniq-warning">
                          <span>&bull; Misconceptions:</span>
                          <span className="font-bold">{feedbackReport.responseQuality.misconceptions}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* MIDDLE PANEL (Col 4): Strengths & Knowledge Gaps */}
              <div className="col-span-1 md:col-span-4 space-y-5">
                
                <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-2.5">
                  <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                    Strengths
                  </h3>
                  <ul className="space-y-2 text-xs text-infiniq-text-secondary font-sans">
                    {(feedbackReport?.strengths && feedbackReport.strengths.length > 0
                      ? feedbackReport.strengths
                      : ["Demonstrated foundational domain familiarity across prompt requirements."]
                    ).slice(0, 4).map((st: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-infiniq-accent font-bold">&bull;</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-2.5">
                  <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                    Knowledge Gaps
                  </h3>
                  <ul className="space-y-2 text-xs text-infiniq-text-secondary font-sans">
                    {(feedbackReport?.gaps && feedbackReport.gaps.length > 0
                      ? feedbackReport.gaps
                      : ["Deepen familiarity with high-concurrency edge cases and production failure modes."]
                    ).slice(0, 4).map((gp: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-infiniq-warning font-bold">&bull;</span>
                        <span>{gp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* RIGHT PANEL (Col 4): Recommended Next Steps & Topics Evaluated */}
              <div className="col-span-1 md:col-span-4 space-y-5">
                
                <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-2.5">
                  <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                    Recommended Next Steps
                  </h3>
                  <ul className="space-y-2 text-xs text-infiniq-text-secondary font-sans">
                    {(feedbackReport?.next && feedbackReport.next.length > 0
                      ? feedbackReport.next
                      : [
                          "Practice edge-case recovery and high-concurrency bottleneck analysis.",
                          "Study observability metrics and tracing in distributed production workloads."
                        ]
                    ).slice(0, 4).map((nx: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-infiniq-accent font-bold">&bull;</span>
                        <span>{nx}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-2.5">
                  <h3 className="font-sans font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                    Topics Evaluated
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {(feedbackReport?.coveredTopics && feedbackReport.coveredTopics.length > 0
                      ? feedbackReport.coveredTopics
                      : ["System Architecture"]
                    ).map((t: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-[9px] px-2 py-1 rounded bg-infiniq-surface-2 border border-infiniq-border/40 text-infiniq-text-secondary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Turn-by-Turn Question & Answer Review (Expandable Section) */}
            {feedbackReport?.responses && feedbackReport.responses.length > 0 && (
              <div className="p-5 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 space-y-4 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-infiniq-border/30 pb-2">
                  <div>
                    <h3 className="font-semibold text-xs text-infiniq-text-primary uppercase tracking-wider">
                      Review Responses
                    </h3>
                    <p className="text-[11px] text-infiniq-text-secondary">
                      Question-by-question technical evaluations and interviewer analysis.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] text-infiniq-text-muted">
                    {feedbackReport.responses.length} Turns Evaluated
                  </span>
                </div>

                <div className="space-y-3 pt-1">
                  {feedbackReport.responses.map((turn: any, idx: number) => {
                    const ev = turn.evaluation;
                    const classification = ev?.classification || "CORRECT";
                    const isIrrelevant = classification === "IRRELEVANT";
                    const isMisconception = classification === "MISCONCEPTION";
                    const isCorrect = classification === "CORRECT";

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-md border border-infiniq-border/40 bg-infiniq-surface-2/40 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[10px] font-bold text-infiniq-accent">
                            Question {idx + 1} &bull; {turn.topic || "Core Architecture"}
                          </span>
                          <div className="flex items-center gap-2 font-mono text-[10px]">
                            <span
                              className={`px-2 py-0.5 rounded border font-semibold ${
                                isCorrect
                                  ? "bg-infiniq-success/15 border-infiniq-success/40 text-infiniq-success"
                                  : isIrrelevant
                                  ? "bg-infiniq-error/15 border-infiniq-error/40 text-infiniq-error"
                                  : isMisconception
                                  ? "bg-infiniq-warning/15 border-infiniq-warning/40 text-infiniq-warning"
                                  : "bg-infiniq-accent/15 border-infiniq-accent/40 text-infiniq-accent"
                              }`}
                            >
                              {classification}
                            </span>
                            <span className="text-infiniq-text-primary font-bold">
                              {ev?.score ?? 70}%
                            </span>
                          </div>
                        </div>

                        <p className="font-medium text-infiniq-text-primary leading-snug">
                          {turn.questionText || "Technical Question"}
                        </p>

                        <div className="p-2.5 rounded bg-infiniq-bg/60 border border-infiniq-border/30 font-mono text-[11px] text-infiniq-text-secondary leading-relaxed">
                          <span className="text-infiniq-text-muted select-none">Candidate Answer: </span>
                          <span>&ldquo;{turn.text}&rdquo;</span>
                        </div>

                        {ev?.explanation && (
                          <div className="text-[11px] text-infiniq-text-secondary pt-0.5 flex items-start gap-1.5 font-sans">
                            <span className="font-mono text-[10px] uppercase text-infiniq-text-muted font-bold">Analysis:</span>
                            <span>{ev.explanation}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-infiniq-border/30">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab("candidates")}
                className="w-full sm:w-auto text-xs h-10 sm:h-9"
              >
                Select New Candidate
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveTab("history")}
                className="w-full sm:w-auto text-xs h-10 sm:h-9"
              >
                View in History &rarr;
              </Button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
