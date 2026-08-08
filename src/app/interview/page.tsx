"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Container from "@/components/layout/Container";
import TheCore from "@/components/core/TheCore";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Divider from "@/components/ui/Divider";
import { CinematicHeading, SectionHeading, BodyText, DevLabel } from "@/components/ui/Typography";
import { CoreState } from "@/types/core";
import { AnsweringState } from "@/types/interview";
import {
  Terminal,
  ArrowRight,
  CornerDownRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  User,
  GraduationCap,
  Briefcase,
  Layers,
  Award,
  Zap,
  Target,
  FileText,
  Activity,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

const ANALYZING_MESSAGES = [
  "Understanding your reasoning...",
  "Evaluating technical depth...",
  "Checking curriculum context...",
  "Determining next challenge...",
];

export default function InterviewChamber() {
  const shouldReduceMotion = useReducedMotion();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Candidate Selection States
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
  const [isSelectingCandidate, setIsSelectingCandidate] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(true);

  // Orchestrator States
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestionText, setCurrentQuestionText] = useState("");
  const [questionNumber, setQuestionNumber] = useState(1);
  const [totalQuestions] = useState(8);
  const [responseText, setResponseText] = useState("");
  const [currentState, setCurrentState] = useState<AnsweringState>("ready");
  const [coreState, setCoreState] = useState<CoreState>("idle");
  const [analyzingStep, setAnalyzingStep] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Edge Case & Report States
  const [shortAnswerPrompt, setShortAnswerPrompt] = useState(false);
  const [isInterrupted, setIsInterrupted] = useState(false);
  const [feedbackReport, setFeedbackReport] = useState<any | null>(null);

  // Load candidates on mount
  useEffect(() => {
    async function loadCandidates() {
      try {
        const res = await fetch("/api/candidates");
        if (!res.ok) throw new Error("Failed to load candidates");
        const data = await res.json();
        setCandidates(data);
        if (data.length > 0) {
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

  // Keyboard shortcut Ctrl/Cmd + Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (currentState === "ready" || currentState === "answering") {
          e.preventDefault();
          handleSubmit();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [responseText, currentState, sessionId]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseText(e.target.value);
    setValidationError(null);
    if (currentState === "ready") {
      setCurrentState("answering");
    }
  };

  // Begin interview with selected candidate
  const handleBeginInterview = async () => {
    if (!selectedCandidate) return;

    setIsSelectingCandidate(false);
    setCurrentState("thinking");
    setCoreState("thinking");
    setValidationError(null);

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

      // Split welcome and first question
      const replyText = data.reply;
      const parts = replyText.split("\n\n");
      const questionContent = parts.slice(1).join("\n\n").replace("First Question: ", "");

      setCurrentQuestionText(questionContent);
      setQuestionNumber(1);
      setCurrentState("ready");
      setCoreState("listening");
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 300);
    } catch (err) {
      console.error("Failed to start session:", err);
      setIsInterrupted(true);
      setCurrentState("error");
      setCoreState("idle");
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
      return;
    }

    setValidationError(null);
    setShortAnswerPrompt(false);
    setCurrentState("thinking");
    setCoreState("thinking");
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
          setFeedbackReport(data.feedback);
        } else {
          setCurrentQuestionText(data.reply);
          setQuestionNumber((prev) => prev + 1);
          setResponseText("");
          setCurrentState("ready");
          setCoreState("listening");
          setTimeout(() => {
            if (textareaRef.current) textareaRef.current.focus();
          }, 100);
        }
      }, 1200);
    } catch (err) {
      clearInterval(interval);
      console.error("Error submitting response:", err);
      setIsInterrupted(true);
      setCurrentState("error");
      setCoreState("idle");
    }
  };

  const handleRetryAfterInterruption = async () => {
    setIsInterrupted(false);
    if (!sessionId) {
      setIsSelectingCandidate(true);
      return;
    }

    setCurrentState("thinking");
    setCoreState("thinking");

    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          candidate: selectedCandidate,
        }),
      });

      if (!res.ok) throw new Error("Recovery API call failed");
      const data = await res.json();

      const replyText = data.reply;
      const questionContent = replyText.includes("Welcome")
        ? replyText.split("\n\n").slice(1).join("\n\n").replace("First Question: ", "")
        : replyText;

      setCurrentQuestionText(questionContent);
      setCurrentState("ready");
      setCoreState("listening");
      setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 300);
    } catch (err) {
      console.error("Recovery failed:", err);
      setIsInterrupted(true);
      setCurrentState("error");
      setCoreState("idle");
    }
  };

  const triggerMockInterruption = () => {
    setIsInterrupted(true);
    setCurrentState("error");
    setCoreState("idle");
  };

  const getActiveDomainLabel = (num: number) => {
    if (num <= 2) return "Embeddings & Vector Search (Day 10)";
    if (num <= 4) return "LLM Core, Prompting & Fine-Tuning (Day 15)";
    if (num <= 6) return "Agentic AI & MCP (Day 23)";
    return "Performance Optimization & Cost (Day 26)";
  };

  // Render text progress bar format: ████████████░░░░ 4 / 8
  const getVisualProgressBar = (current: number, total: number) => {
    const filledCount = Math.round((current / total) * 16); // 16 characters wide
    const unfilledCount = 16 - filledCount;
    const filled = "█".repeat(Math.max(0, filledCount));
    const unfilled = "░".repeat(Math.max(0, unfilledCount));
    return `${filled}${unfilled}  ${current} / ${total}`;
  };

  const wordCount = responseText.trim() === "" ? 0 : responseText.trim().split(/\s+/).length;
  const charCount = responseText.length;

  return (
    <div className="min-h-screen bg-infiniq-bg text-infiniq-text-primary scientific-grid flex flex-col justify-between py-6 px-4 sm:px-6 lg:py-8 relative overflow-hidden">
      
      {/* Top Header Navigation */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between z-10 select-none border-b border-infiniq-border/40 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-infiniq-text-muted" />
          <Link
            href="/"
            className="font-mono text-xs tracking-wider text-infiniq-text-muted hover:text-infiniq-text-primary transition-colors infiniq-focus font-bold"
          >
            INFINIQ
          </Link>
        </div>

        {!isSelectingCandidate && currentState !== "completed" && (
          <div className="hidden lg:flex items-center gap-4 font-mono text-[9px] uppercase tracking-widest text-infiniq-text-muted">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${coreState === 'thinking' ? 'bg-infiniq-violet animate-pulse' : 'bg-emerald-400'}`} />
              STATUS: {coreState}
            </span>
            <span className="opacity-40">&bull;</span>
            <span>NODE ID: {sessionId?.substring(0, 12)}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isSelectingCandidate && currentState !== "completed" && (
            <button
              onClick={triggerMockInterruption}
              disabled={currentState === "thinking"}
              className="font-mono text-[9px] uppercase tracking-widest text-infiniq-text-muted hover:text-rose-400 border border-infiniq-border px-2 py-0.5 rounded transition-all disabled:opacity-20"
            >
              Simulate Interrupt
            </button>
          )}

          <span className="font-mono text-xs text-infiniq-text-secondary font-semibold">
            {isSelectingCandidate ? (
              "CANDIDATE INGESTION"
            ) : (
              <span>AI INTERVIEWER &bull; {selectedCandidate?.member.name} ({selectedCandidate?.id})</span>
            )}
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow w-full flex items-center justify-center py-4 z-10">
        <Container isMobileLocked={false} className="w-full">
          
          <AnimatePresence mode="wait">
            
            {/* PAGE 1: Responsive Candidate Selection Layout */}
            {isSelectingCandidate && (
              <motion.div
                key="selector-page"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 text-left max-w-6xl mx-auto w-full"
              >
                <div className="space-y-1.5">
                  <DevLabel>EVALUATION PLATFORM</DevLabel>
                  <CinematicHeading className="text-2xl sm:text-3xl font-light">Select Ingestion Candidate</CinematicHeading>
                </div>

                {loadingCandidates ? (
                  <div className="flex justify-center items-center py-16 font-mono text-xs text-infiniq-text-muted">
                    <RefreshCw size={14} className="animate-spin mr-2" /> Ingesting candidate metadata...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left: Interactive Grid of Candidates */}
                    <div className="col-span-1 lg:col-span-7 space-y-4">
                      <DevLabel className="block text-[10px] text-infiniq-text-muted">AVAILABLE DATASETS</DevLabel>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                        {candidates.map((c) => {
                          const isSelected = selectedCandidate?.id === c.id;
                          return (
                            <div
                              key={c.id}
                              onClick={() => setSelectedCandidate(c)}
                              className={`p-4 rounded border text-left cursor-pointer transition-all duration-200 select-none ${
                                isSelected
                                  ? "border-infiniq-indigo bg-infiniq-indigo/5 ring-1 ring-infiniq-indigo/35"
                                  : "border-infiniq-border/40 bg-infiniq-surface-1/40 hover:border-infiniq-border hover:bg-infiniq-surface-1/60"
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="font-mono text-[9px] uppercase tracking-wider text-infiniq-text-muted">{c.id}</span>
                                  <h4 className="font-sans font-bold text-sm text-infiniq-text-primary mt-0.5">{c.member.name}</h4>
                                </div>
                              </div>
                              <p className="font-mono text-[10px] text-infiniq-text-secondary mb-3 truncate">{c.member.jobRole}</p>
                              <div className="text-[9px] text-infiniq-text-muted space-y-1 border-t border-infiniq-border/20 pt-2 font-mono">
                                <div className="flex justify-between">
                                  <span>Completed Days:</span>
                                  <span className="text-emerald-400 font-bold">{c.missions.missionsCompleted} D</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Consistency:</span>
                                  <span className="text-infiniq-indigo font-bold">{c.missions.commitDays} Days</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Selected Candidate Comprehensive Telemetry */}
                    <div className="col-span-1 lg:col-span-5 space-y-4">
                      <DevLabel className="block text-[10px] text-infiniq-text-muted">CANDIDATE INTELLIGENCE BRIEFING</DevLabel>
                      {selectedCandidate && (
                        <div className="p-5 rounded border border-infiniq-border/40 bg-infiniq-surface-1/30 space-y-4 text-left transition-all duration-300">
                          
                          {/* Profile Header */}
                          <div className="border-b border-infiniq-border/20 pb-3">
                            <span className="font-mono text-[9px] text-infiniq-text-muted uppercase">Selected Metadata</span>
                            <CinematicHeading className="text-lg font-light mt-1">{selectedCandidate.member.name}</CinematicHeading>
                            <BodyText className="text-xs text-infiniq-text-secondary mt-0.5 font-mono">{selectedCandidate.member.jobRole}</BodyText>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-2.5 text-center bg-infiniq-surface-1/60 p-2.5 rounded border border-infiniq-border/20 font-mono text-[9px]">
                            <div>
                              <span className="text-infiniq-text-muted block text-[7px] tracking-wide">ATTEMPTS</span>
                              <span className="text-infiniq-text-primary font-bold text-xs">{selectedCandidate.missions.attempts}</span>
                            </div>
                            <div>
                              <span className="text-infiniq-text-muted block text-[7px] tracking-wide">FIRST-TRY</span>
                              <span className="text-emerald-400 font-bold text-xs">{selectedCandidate.missions.firstTryMissions}</span>
                            </div>
                            <div>
                              <span className="text-infiniq-text-muted block text-[7px] tracking-wide">SKIPPED</span>
                              <span className="text-rose-400 font-bold text-xs">{selectedCandidate.missions.skippedMissions.length}</span>
                            </div>
                          </div>

                          {/* Bio */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                            <div>
                              <span className="text-infiniq-text-muted block text-[8px] uppercase mb-1">Education</span>
                              <div className="text-infiniq-text-secondary flex items-start gap-1">
                                <GraduationCap size={12} className="mt-0.5 flex-shrink-0 text-infiniq-indigo" />
                                <span>{selectedCandidate.member.education}</span>
                              </div>
                            </div>
                            <div>
                              <span className="text-infiniq-text-muted block text-[8px] uppercase mb-1">Professional Baseline</span>
                              <div className="text-infiniq-text-secondary flex items-start gap-1">
                                <Briefcase size={12} className="mt-0.5 flex-shrink-0 text-infiniq-indigo" />
                                <span>{selectedCandidate.member.yearsExperience} Years Exp</span>
                              </div>
                            </div>
                          </div>

                          {/* Signal Matrices */}
                          <div className="grid grid-cols-1 gap-3 pt-3 border-t border-infiniq-border/20 font-mono text-xs">
                            {selectedCandidate.signals.strengthSignals.length > 0 && (
                              <div>
                                <span className="text-emerald-400 block text-[8px] uppercase mb-1">Strength Signals</span>
                                <div className="space-y-1">
                                  {selectedCandidate.signals.strengthSignals.map((s: string, idx: number) => (
                                    <div key={idx} className="text-emerald-400/90 flex items-center gap-1.5 text-[10px]">
                                      <span className="w-1 h-1 rounded-full bg-emerald-400 flex-shrink-0" />
                                      <span className="truncate">{s}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedCandidate.signals.weaknessSignals.length > 0 && (
                              <div>
                                <span className="text-amber-400 block text-[8px] uppercase mb-1">Weakness Signals</span>
                                <div className="space-y-1">
                                  {selectedCandidate.signals.weaknessSignals.map((w: string, idx: number) => (
                                    <div key={idx} className="text-amber-400/90 flex items-center gap-1.5 text-[10px]">
                                      <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                                      <span className="truncate">{w}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <Button onClick={handleBeginInterview} className="w-full h-11 select-none">
                            Ingest Profile & Start Evaluation
                            <ArrowRight size={14} className="ml-2" />
                          </Button>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* PAGE 2: Responsive Active Interview Chamber Layout */}
            {!isSelectingCandidate && currentState !== "completed" && !isInterrupted && (
              <motion.div
                key="active-chamber"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left max-w-6xl mx-auto w-full items-stretch"
              >
                
                {/* LEFT COLUMN: Interview Conversation & Input */}
                <div className="col-span-1 lg:col-span-8 flex flex-col justify-between space-y-6">
                  
                  {/* Progress Header & Question */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-infiniq-border/20 pb-3.5 select-none">
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-infiniq-text-muted">EVALUATION FEED</span>
                        <CinematicHeading className="text-lg font-normal text-infiniq-indigo">
                          QUESTION 0{questionNumber} / 0{totalQuestions}
                        </CinematicHeading>
                      </div>
                      
                      {/* Character Progress Bar */}
                      <div className="font-mono text-xs text-infiniq-text-secondary self-start sm:self-center">
                        <span className="text-infiniq-indigo font-semibold">{getVisualProgressBar(questionNumber, totalQuestions)}</span>
                      </div>
                    </div>

                    {/* Question Text */}
                    <div className="py-2 min-h-[90px]">
                      <CinematicHeading className="text-lg sm:text-xl font-light text-infiniq-text-primary leading-snug">
                        {currentQuestionText || "Synthesizing next challenge telemetry..."}
                      </CinematicHeading>
                    </div>
                  </div>

                  {/* Reasoning Input Editor */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center select-none">
                      <DevLabel className="text-[10px]">Your Response formulation</DevLabel>
                      <span className="font-mono text-[9px] text-infiniq-text-muted">
                        {wordCount} w &bull; {charCount} c
                      </span>
                    </div>

                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        rows={6}
                        disabled={currentState === "thinking" || currentState === "submitting"}
                        value={responseText}
                        onChange={handleTextChange}
                        placeholder="Explain your technical reasoning, structural decisions, and engineering trade-offs..."
                        className="w-full bg-infiniq-surface-1 border border-infiniq-border rounded-md px-3.5 py-3 font-sans text-sm text-infiniq-text-primary placeholder-infiniq-text-muted/50 focus:outline-none focus:ring-1 focus:ring-infiniq-indigo/40 focus:border-infiniq-indigo/50 transition-all resize-none disabled:opacity-40 infiniq-focus"
                        aria-label="Candidate response formulation area"
                      />
                      <span className="hidden md:inline absolute bottom-3.5 right-4 font-mono text-[9px] text-infiniq-text-muted select-none">
                        Press Ctrl+Enter to submit
                      </span>
                    </div>

                    {/* Warnings & Loading telemetries */}
                    <AnimatePresence>
                      {validationError && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex items-start gap-1.5 text-xs text-amber-400 select-none py-1"
                        >
                          <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                          <span>{validationError}</span>
                        </motion.div>
                      )}

                      {currentState === "thinking" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2 text-xs font-mono text-infiniq-violet select-none py-1"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-infiniq-violet animate-pulse" />
                          <span>{ANALYZING_MESSAGES[analyzingStep]}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Submission Button */}
                  <div className="pt-2 select-none">
                    <Button
                      variant={responseText.trim() === "" ? "secondary" : "primary"}
                      onClick={handleSubmit}
                      className="w-full h-12 text-sm"
                      disabled={currentState === "thinking" || responseText.trim() === ""}
                    >
                      {currentState === "thinking" ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f8fafc] animate-pulse mr-2" />
                          Evaluating response...
                        </>
                      ) : (
                        <>
                          Submit Response
                          <ArrowRight size={14} className="ml-2" />
                        </>
                      )}
                    </Button>
                  </div>

                </div>

                {/* RIGHT COLUMN: Adaptive Engine Context Indicators */}
                <div className="col-span-1 lg:col-span-4 space-y-6">
                  
                  {/* Active Candidate Context card */}
                  <div className="p-4 rounded border border-infiniq-border/40 bg-infiniq-surface-1/40 space-y-3 font-mono text-xs select-none">
                    <span className="text-[10px] text-infiniq-text-muted block border-b border-infiniq-border/20 pb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <User size={10} /> CANDIDATE PROFILE Context
                    </span>
                    <div className="space-y-1">
                      <h4 className="font-sans font-bold text-sm text-infiniq-text-primary leading-tight">{selectedCandidate?.member.name}</h4>
                      <p className="text-[10px] text-infiniq-text-secondary truncate mt-0.5">{selectedCandidate?.member.jobRole}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 bg-infiniq-surface-1/70 p-2 rounded border border-infiniq-border/20 text-[9px] mt-2">
                      <div>
                        <span className="text-infiniq-text-muted block text-[7px] leading-none uppercase mb-0.5">Missions</span>
                        <span className="text-emerald-400 font-bold">{selectedCandidate?.missions.missionsCompleted} Days</span>
                      </div>
                      <div>
                        <span className="text-infiniq-text-muted block text-[7px] leading-none uppercase mb-0.5">Education</span>
                        <span className="text-infiniq-text-primary font-bold truncate block">{selectedCandidate?.member.education}</span>
                      </div>
                    </div>
                  </div>

                  {/* Adaptive Engine parameters card */}
                  <div className="p-5 rounded border border-infiniq-border/40 bg-infiniq-surface-1/30 space-y-5 text-left h-full flex flex-col justify-between font-mono text-xs">
                    
                    <div className="space-y-4">
                      <div className="border-b border-infiniq-border/20 pb-3 select-none">
                        <span className="text-[10px] text-infiniq-text-muted block mb-2 uppercase tracking-wider flex items-center gap-1">
                          <Activity size={12} /> ADAPTIVE ENGINE STATUS
                        </span>
                        <div className="flex flex-wrap gap-2 items-center">
                          <Badge variant="indigo" showDot className="bg-infiniq-indigo/5 text-[9px] uppercase">
                            STATUS: {coreState}
                          </Badge>
                          <Badge variant="slate" className="bg-infiniq-surface-3 border-infiniq-border/30 text-[9px] uppercase">
                            Difficulty: {selectedCandidate?.signals.confidenceLevel || "medium"}
                          </Badge>
                        </div>
                      </div>

                      {/* Topics Covered */}
                      <div className="space-y-2">
                        <span className="text-infiniq-text-muted block text-[8px] uppercase tracking-widest">Syllabus Domains Tested</span>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCandidate?.missions.completedMissions.slice(0, 3).map((dNum: number, idx: number) => (
                            <span key={idx} className="text-[9px] px-2 py-0.5 rounded bg-infiniq-surface-2 border border-infiniq-border/25 text-infiniq-text-secondary select-none">
                              Day {dNum} Module
                            </span>
                          ))}
                          <span className="text-[9px] px-2 py-0.5 rounded bg-infiniq-indigo/10 border border-infiniq-indigo/25 text-infiniq-indigo select-none">
                            Active Topic
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline of Engine Decisions */}
                    <div className="border-t border-infiniq-border/20 pt-4 space-y-3">
                      <span className="text-infiniq-text-muted block text-[8px] uppercase tracking-widest select-none flex items-center gap-1">
                        <Terminal size={10} /> ENGINE PATH TIMELINE
                      </span>
                      <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        <div className="relative border-l border-infiniq-border/30 pl-3.5 py-0.5">
                          <span className="absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-infiniq-indigo" />
                          <span className="text-[8px] text-emerald-400 font-bold block mb-0.5">SESSION_START</span>
                          <p className="text-[10px] text-infiniq-text-secondary font-sans leading-snug">
                            Initialized telemetry for candidate {selectedCandidate?.id}. Planning 8 questions across curriculum.
                          </p>
                        </div>
                        {questionNumber > 1 && (
                          <div className="relative border-l border-infiniq-border/30 pl-3.5 py-0.5">
                            <span className="absolute -left-[3px] top-1.5 w-1.5 h-1.5 rounded-full bg-infiniq-indigo animate-pulse" />
                            <span className="text-[8px] text-infiniq-text-muted font-bold block mb-0.5">EVAL_LOOP_ACTIVE</span>
                            <p className="text-[10px] text-infiniq-text-secondary font-sans leading-snug">
                              Probing claim depth. Adaptive difficulty adjustments synchronized based on reasoning metrics.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>

              </motion.div>
            )}

            {/* PAGE 3: Connection Interrupted Card (Full responsive modal card layout) */}
            {isInterrupted && (
              <motion.div
                key="interruption-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 py-6 max-w-lg mx-auto w-full"
              >
                <div className="p-6 sm:p-8 rounded border border-rose-500/20 bg-rose-950/5 text-center space-y-5">
                  <div className="inline-flex p-3 rounded-full text-rose-400 border border-rose-500/10 bg-rose-950/10">
                    <AlertCircle size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <DevLabel className="text-rose-400">CONNECTION INTERRUPTED</DevLabel>
                    <CinematicHeading className="text-lg font-light mt-1.5">Your evaluation session is safe.</CinematicHeading>
                    <BodyText className="text-xs text-infiniq-text-muted mt-2 leading-relaxed font-mono">
                      The evaluation node connection dropped. InfiniQ persists session memory securely. Use recovery triggers to continue.
                    </BodyText>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={handleRetryAfterInterruption}
                    className="w-full h-11 border-rose-500/20 text-rose-300 hover:bg-rose-500/10 hover:border-rose-400/30"
                  >
                    <RefreshCw size={12} className="mr-2" />
                    Retry Session
                  </Button>
                </div>
              </motion.div>
            )}

            {/* PAGE 4: Professional Final Scorecard Report (Visual Analytics dashboard style) */}
            {currentState === "completed" && feedbackReport && (
              <motion.div
                key="completed-scorecard"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-left py-2 w-full max-w-6xl mx-auto"
              >
                {/* Top header stats */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-infiniq-border/30 pb-4 select-none">
                  <div>
                    <DevLabel className="text-emerald-400">TECHNICAL ASSIGNMENT EVALUATION DOSSIER</DevLabel>
                    <CinematicHeading className="text-xl sm:text-2xl font-light mt-1">
                      {selectedCandidate?.member.name} &bull; Assessment Report
                    </CinematicHeading>
                    <BodyText className="text-xs text-infiniq-text-secondary font-mono mt-0.5">Role: {selectedCandidate?.member.jobRole}</BodyText>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[9px] uppercase bg-infiniq-surface-1 border border-infiniq-border/40 p-2.5 rounded">
                    <span>TELEMETRY: COMPLETE</span>
                    <span>&bull;</span>
                    <span className="text-emerald-400 font-bold">SCORECARD VERIFIED</span>
                  </div>
                </div>

                <div className="space-y-5 font-mono text-xs">
                  
                  {/* 1. Overall capability metrics & Competency Sub-scores */}
                  <div className="p-5 rounded border border-infiniq-border/40 bg-infiniq-surface-1/40">
                    <span className="text-[10px] text-infiniq-text-muted block mb-4 uppercase tracking-wider flex items-center gap-1">
                      <Layers size={12} /> CORE CAPABILITY METRICS
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      
                      {/* Round Score display */}
                      <div className="col-span-1 md:col-span-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-infiniq-border/20 pb-4 md:pb-0 pr-0 md:pr-4 select-none">
                        <span className="text-[9px] text-infiniq-text-muted font-mono mb-2 uppercase">OVERALL ASSESSMENT SCORE</span>
                        <div className="relative w-24 h-24 flex items-center justify-center bg-infiniq-indigo/5 border-2 border-infiniq-indigo/35 rounded-full">
                          <span className="font-sans font-bold text-2xl text-infiniq-indigo">{feedbackReport.averageScore}%</span>
                        </div>
                      </div>

                      {/* Sub competency progress indicators */}
                      <div className="col-span-1 md:col-span-8 space-y-3 font-mono text-[9px] flex flex-col justify-center">
                        {[
                          { name: "Technical Depth", val: feedbackReport.technicalDepth || 4.2, max: 5 },
                          { name: "Reasoning Quality", val: feedbackReport.reasoning || 4.0, max: 5 },
                          { name: "Response Accuracy", val: feedbackReport.accuracy || 4.4, max: 5 },
                          { name: "Communication", val: feedbackReport.communication || 4.0, max: 5 },
                        ].map((item, idx) => {
                          const percent = (item.val / item.max) * 100;
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex justify-between text-infiniq-text-secondary">
                                <span>{item.name}</span>
                                <span className="font-bold text-infiniq-text-primary">{item.val} / {item.max}</span>
                              </div>
                              <div className="h-1.5 w-full bg-infiniq-surface-3 rounded-full overflow-hidden">
                                <div className="bg-infiniq-indigo h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>

                  {/* 2. Key details summary, strengths & gaps grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    
                    {/* Left: Summary & strengths list */}
                    <div className="col-span-1 lg:col-span-6 space-y-4">
                      {/* Summary */}
                      <div className="p-4 rounded border border-infiniq-border/40 bg-infiniq-surface-1/40">
                        <span className="text-[10px] text-infiniq-text-muted block mb-1 uppercase tracking-wider flex items-center gap-1"><Target size={12} /> EXECUTIVE SUMMARY</span>
                        <p className="text-[11px] sm:text-xs text-infiniq-text-secondary leading-relaxed">{feedbackReport.summary}</p>
                      </div>

                      {/* Strengths */}
                      <div className="p-4 rounded border border-emerald-500/10 bg-emerald-950/5">
                        <span className="text-[10px] text-emerald-400 block mb-2.5 uppercase tracking-wider flex items-center gap-1"><Award size={12} /> CORE STRENGTHS</span>
                        <ul className="space-y-2 list-inside list-disc text-[10.5px] text-infiniq-text-secondary leading-relaxed">
                          {feedbackReport.strengths.map((s: string, idx: number) => (
                            <li key={idx} className="marker:text-emerald-400">{s}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Right: Gaps & Actionable Action Plan */}
                    <div className="col-span-1 lg:col-span-6 space-y-4">
                      {/* Gaps */}
                      <div className="p-4 rounded border border-amber-500/10 bg-amber-950/5">
                        <span className="text-[10px] text-amber-400 block mb-2.5 uppercase tracking-wider flex items-center gap-1"><AlertCircle size={12} /> KNOWLEDGE GAPS</span>
                        <ul className="space-y-2 list-inside list-disc text-[10.5px] text-infiniq-text-secondary leading-relaxed">
                          {feedbackReport.gaps.map((g: string, idx: number) => (
                            <li key={idx} className="marker:text-amber-400">{g}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommended next steps */}
                      <div className="p-4 rounded border border-infiniq-border/40 bg-infiniq-surface-1/40">
                        <span className="text-[10px] text-infiniq-indigo block mb-2.5 uppercase tracking-wider flex items-center gap-1"><Zap size={12} /> RECOMMENDED ACTION PLAN</span>
                        <ul className="space-y-2 list-inside list-decimal text-[10.5px] text-infiniq-text-secondary leading-relaxed">
                          {feedbackReport.next.map((n: string, idx: number) => (
                            <li key={idx} className="marker:text-infiniq-indigo">{n}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                  </div>

                  {/* 3. Topics evaluated grid list */}
                  {feedbackReport.coveredTopics && feedbackReport.coveredTopics.length > 0 && (
                    <div className="p-4 rounded border border-infiniq-border/40 bg-infiniq-surface-1/40">
                      <span className="text-[10px] text-infiniq-text-muted block mb-2.5 uppercase tracking-wider flex items-center gap-1">
                        <Target size={12} /> EVALUATED SYLLABUS TOPICS
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {feedbackReport.coveredTopics.map((topic: string, idx: number) => (
                          <span key={idx} className="text-[9px] px-2.5 py-0.5 rounded bg-infiniq-surface-3 border border-infiniq-border/30 text-infiniq-text-secondary select-none">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. Timeline of engine decisions (explainability) */}
                  {feedbackReport.decisions && feedbackReport.decisions.length > 0 && (
                    <div className="p-4 rounded border border-infiniq-border/40 bg-infiniq-surface-1/40">
                      <span className="text-[10px] text-infiniq-text-muted block mb-3.5 uppercase tracking-wider flex items-center gap-1">
                        <Terminal size={12} /> ADAPTIVE ENGINE DECISIONS LOG HISTORY
                      </span>
                      <div className="space-y-3.5 pl-1 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        {feedbackReport.decisions.map((d: any, idx: number) => (
                          <div key={idx} className="relative border-l border-infiniq-border/30 pl-4 py-0.5">
                            <span className="absolute -left-[4px] top-2 w-2 h-2 rounded-full bg-infiniq-indigo" />
                            <div className="flex flex-wrap items-center gap-2 mb-1 select-none">
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono font-bold leading-none ${
                                d.type === 'DEEPER_CHALLENGE' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/20' :
                                d.type === 'FOUNDATION_REPAIR' ? 'bg-rose-950/40 text-rose-400 border border-rose-500/20' :
                                'bg-infiniq-surface-3 text-infiniq-text-secondary border border-infiniq-border/30'
                              }`}>
                                {d.type}
                              </span>
                              <span className="text-[9px] text-infiniq-text-muted font-mono">Day {d.curriculumDay} &bull; {d.targetConcept}</span>
                            </div>
                            <p className="text-[11px] text-infiniq-text-secondary leading-relaxed font-sans">{d.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Final controls */}
                <div className="space-y-2.5 pt-4 border-t border-infiniq-border/30 select-none">
                  <Button onClick={() => window.location.reload()} className="w-full h-11">
                    Select New Candidate Profile
                  </Button>
                  <Link href="/" className="block">
                    <Button variant="ghost" className="w-full text-xs h-10">
                      Return to Hub
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </Container>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto z-10 border-t border-infiniq-border/40 pt-5 mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left select-none">
        <span className="font-mono text-[9px] uppercase tracking-wider text-infiniq-text-muted">
          INFINIQ CORE INGESTION SYSTEMS
        </span>
        {!isSelectingCandidate && (
          <span className="font-mono text-[9px] text-infiniq-text-secondary uppercase tracking-widest opacity-80">
            Node: Live &bull; Session {sessionId?.substring(0, 12)}
          </span>
        )}
      </footer>

    </div>
  );
}
