"use client";

import React, { useState, useEffect, useMemo } from "react";
import { InterviewSession } from "@/types/interview";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import {
  Search,
  ChevronDown,
  ArrowRight,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  Activity,
  Calendar,
  Sparkles,
  BarChart3,
  Award,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Terminal,
  ShieldCheck,
  Zap
} from "lucide-react";

interface InterviewHistoryViewProps {
  onStartNewInterview?: () => void;
  onSelectCandidate?: (candidate: any) => void;
}

export default function InterviewHistoryView({
  onStartNewInterview,
  onSelectCandidate,
}: InterviewHistoryViewProps) {
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [candidateFilter, setCandidateFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "score">("newest");

  // Selected session for detail inspection modal
  const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview");
      if (!res.ok) throw new Error("Failed to fetch interview history.");
      const data: InterviewSession[] = await res.json();

      // Also check if any sessions were saved in localStorage
      let localSessions: InterviewSession[] = [];
      try {
        const stored = localStorage.getItem("infiniq_local_sessions");
        if (stored) {
          localSessions = JSON.parse(stored);
        }
      } catch (e) {
        console.warn("localStorage read failed:", e);
      }

      // Merge sessions by ID
      const sessionMap = new Map<string, InterviewSession>();
      data.forEach((s) => sessionMap.set(s.id, s));
      localSessions.forEach((s) => sessionMap.set(s.id, s));

      const merged = Array.from(sessionMap.values());
      setSessions(merged);
    } catch (err: any) {
      console.error("Error loading interview history:", err);
      setError("Unable to load interview history. Something interrupted the connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const total = sessions.length;
    const completed = sessions.filter((s) => s.status === "completed").length;
    const inProgress = sessions.filter((s) => s.status !== "completed").length;
    const scores = sessions
      .map((s) => s.finalFeedback?.averageScore || 0)
      .filter((sc) => sc > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return { total, completed, inProgress, avgScore };
  }, [sessions]);

  // Unique Candidates for filter dropdown
  const uniqueCandidateNames = useMemo(() => {
    const names = new Set<string>();
    sessions.forEach((s) => {
      if (s.candidate?.member?.name) {
        names.add(s.candidate.member.name);
      }
    });
    return Array.from(names);
  }, [sessions]);

  // Filtered & Sorted Sessions
  const filteredSessions = useMemo(() => {
    return sessions
      .filter((s) => {
        const candidateName = s.candidate?.member?.name || "";
        const role = s.candidate?.member?.jobRole || "";
        const id = s.candidateId || s.id || "";

        const matchesSearch =
          searchQuery === "" ||
          candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          id.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "completed" && s.status === "completed") ||
          (statusFilter === "in_progress" && s.status !== "completed") ||
          (statusFilter === "interrupted" && s.status === "error");

        const matchesCandidate =
          candidateFilter === "all" || candidateName === candidateFilter;

        return matchesSearch && matchesStatus && matchesCandidate;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime();
        }
        if (sortBy === "score") {
          const scoreA = a.finalFeedback?.averageScore || 0;
          const scoreB = b.finalFeedback?.averageScore || 0;
          return scoreB - scoreA;
        }
        return 0;
      });
  }, [sessions, searchQuery, statusFilter, candidateFilter, sortBy]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Recent";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recent";
    }
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "IQ";
    const parts = name.split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : parts[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-7xl mx-auto w-full text-left font-sans select-none">
      
      {/* ========================================================================= */}
      {/* 1. PAGE HEADER & SEARCH / FILTER CONTROLS                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-infiniq-border/40 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-infiniq-text-primary tracking-tight">
            Interview History
          </h1>
          <p className="text-xs text-infiniq-text-secondary mt-0.5">
            Review completed interviews, candidate performance, and adaptive interviewer decisions.
          </p>
        </div>

        {/* Action & Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          
          {/* Search Input */}
          <div className="relative flex-grow sm:flex-grow-0 min-w-[160px] sm:min-w-[220px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-infiniq-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, role, ID..."
              className="w-full pl-8 pr-3 py-1.5 bg-infiniq-surface-1 border border-infiniq-border rounded-md text-xs text-infiniq-text-primary placeholder:text-infiniq-text-muted focus:outline-none focus:border-infiniq-accent/50 font-sans infiniq-focus"
            />
          </div>

          {/* Candidate Filter Dropdown */}
          <div className="relative flex-grow sm:flex-grow-0">
            <select
              value={candidateFilter}
              onChange={(e) => setCandidateFilter(e.target.value)}
              className="w-full appearance-none bg-infiniq-surface-1 border border-infiniq-border rounded-md text-xs text-infiniq-text-secondary pl-3 pr-7 py-1.5 focus:outline-none focus:border-infiniq-accent/50 cursor-pointer"
            >
              <option value="all">All Candidates</option>
              {uniqueCandidateNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-infiniq-text-muted pointer-events-none" />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative flex-grow sm:flex-grow-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-infiniq-surface-1 border border-infiniq-border rounded-md text-xs text-infiniq-text-secondary pl-3 pr-7 py-1.5 focus:outline-none focus:border-infiniq-accent/50 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="interrupted">Interrupted</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-infiniq-text-muted pointer-events-none" />
          </div>

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-infiniq-surface-1 border border-infiniq-border rounded-md text-xs text-infiniq-text-secondary pl-3 pr-7 py-1.5 focus:outline-none focus:border-infiniq-accent/50 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="score">Highest Score</option>
            </select>
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-infiniq-text-muted pointer-events-none" />
          </div>

          {/* Refresh button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchHistory}
            className="h-8 px-2.5 text-infiniq-text-muted hover:text-infiniq-accent"
            title="Refresh History"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-infiniq-accent" : ""} />
          </Button>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT SUMMARY STRIP                                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
            Total Interviews
          </span>
          <span className="font-sans text-xl sm:text-2xl font-bold text-infiniq-text-primary block">
            {metrics.total}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
            Completed
          </span>
          <span className="font-sans text-xl sm:text-2xl font-bold text-infiniq-success block">
            {metrics.completed}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
            In Progress
          </span>
          <span className="font-sans text-xl sm:text-2xl font-bold text-infiniq-accent block">
            {metrics.inProgress}
          </span>
        </div>

        <div className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-infiniq-text-muted block">
            Average Score
          </span>
          <span className="font-sans text-xl sm:text-2xl font-bold text-infiniq-text-primary block">
            {metrics.avgScore > 0 ? `${metrics.avgScore}%` : "—"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LOADING, ERROR, EMPTY & TABLE STATES                                   */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="p-8 rounded-lg border border-infiniq-border/40 bg-infiniq-surface-1/30 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-infiniq-text-muted">
            <RefreshCw size={14} className="animate-spin text-infiniq-accent" />
            <span>Retrieving interview sessions and telemetry records...</span>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded bg-infiniq-surface-2/40 animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-8 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 text-center space-y-3">
          <AlertCircle size={24} className="text-infiniq-warning mx-auto" />
          <h3 className="text-sm font-semibold text-infiniq-text-primary">
            Unable to load interview history
          </h3>
          <p className="text-xs text-infiniq-text-secondary max-w-md mx-auto">
            Something interrupted the connection. Your interview data has not been changed.
          </p>
          <Button variant="primary" size="sm" onClick={fetchHistory} className="text-xs mt-2">
            Try Again
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        /* Empty State */
        <div className="p-12 rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-infiniq-surface-2 border border-infiniq-border flex items-center justify-center text-infiniq-accent mx-auto">
            <Clock size={20} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-infiniq-text-primary">
              Your interview history is empty
            </h3>
            <p className="text-xs text-infiniq-text-secondary max-w-sm mx-auto">
              Completed interviews will appear here with performance insights and interviewer decisions.
            </p>
          </div>
          {onStartNewInterview && (
            <Button
              variant="primary"
              size="md"
              onClick={onStartNewInterview}
              className="text-xs font-semibold px-5 mt-2"
            >
              Start an Interview
            </Button>
          )}
        </div>
      ) : filteredSessions.length === 0 ? (
        /* No Match State */
        <div className="p-10 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 text-center space-y-3">
          <Filter size={20} className="text-infiniq-text-muted mx-auto" />
          <p className="text-xs text-infiniq-text-secondary">
            No interviews match your current filters.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearchQuery("");
              setStatusFilter("all");
              setCandidateFilter("all");
            }}
            className="text-xs h-8"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        /* Desktop Table & Mobile Cards */
        <div className="rounded-lg border border-infiniq-border/70 bg-infiniq-surface-1/40 overflow-hidden">
          
          {/* Desktop Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 border-b border-infiniq-border/50 bg-infiniq-surface-2/60 font-mono text-[10px] uppercase tracking-wider text-infiniq-text-muted">
            <span className="col-span-3">Candidate</span>
            <span className="col-span-3">Role & Experience</span>
            <span className="col-span-2">Date</span>
            <span className="col-span-2">Progress & Score</span>
            <span className="col-span-2 text-right">Action</span>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-infiniq-border/30">
            {filteredSessions.map((session) => {
              const candidateName = session.candidate?.member?.name || "Candidate";
              const candidateRole = session.candidate?.member?.jobRole || "Engineer";
              const candidateId = session.candidateId || session.candidate?.id || "CAND";
              const yoe = session.candidate?.member?.yearsExperience || 2;
              const edu = session.candidate?.member?.education || "B.Tech";
              const isDone = session.status === "completed";
              const score = session.finalFeedback?.averageScore || 0;
              const questionCount = session.questionCount || 8;
              const totalQ = session.maxQuestions || 8;
              const topic = session.coveredTopics?.[0] || "System Architecture";

              return (
                <div
                  key={session.id}
                  className="p-4 sm:p-5 md:py-3.5 md:px-5 hover:bg-infiniq-surface-2/40 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-4 md:items-center space-y-3 md:space-y-0"
                >
                  {/* Candidate Column */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-infiniq-surface-2 border border-infiniq-accent/30 flex items-center justify-center text-xs font-bold text-infiniq-accent flex-shrink-0">
                      {getInitials(candidateName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans font-semibold text-xs text-infiniq-text-primary truncate">
                          {candidateName}
                        </span>
                        <span className="font-mono text-[9px] text-infiniq-text-muted px-1.5 py-0.2 rounded bg-infiniq-surface-2 border border-infiniq-border/30">
                          {candidateId}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-infiniq-text-muted truncate block md:hidden">
                        {candidateRole} &bull; {yoe} YOE
                      </span>
                    </div>
                  </div>

                  {/* Role Column (Desktop) */}
                  <div className="hidden md:block col-span-3 min-w-0">
                    <span className="font-sans text-xs text-infiniq-text-secondary truncate block">
                      {candidateRole}
                    </span>
                    <span className="font-mono text-[10px] text-infiniq-text-muted truncate block">
                      {yoe} YOE &bull; {edu}
                    </span>
                  </div>

                  {/* Date Column */}
                  <div className="col-span-2 font-mono text-xs text-infiniq-text-secondary flex md:flex-col justify-between md:justify-start">
                    <span className="text-infiniq-text-primary">{formatDate(session.startedAt)}</span>
                    <span className="text-[10px] text-infiniq-text-muted">{formatTime(session.startedAt)}</span>
                  </div>

                  {/* Progress & Score Column */}
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="text-[10px] text-infiniq-text-muted">
                        {questionCount}/{totalQ} Qs
                      </span>
                      {score > 0 ? (
                        <span className="text-xs font-bold text-infiniq-accent">
                          {score}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-infiniq-accent font-mono">
                          In Progress
                        </span>
                      )}
                    </div>
                    {/* Mini progress bar */}
                    <div className="h-1 w-full rounded-full bg-infiniq-surface-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDone ? "bg-infiniq-accent" : "bg-infiniq-accent/70"}`}
                        style={{ width: `${Math.min(100, (questionCount / totalQ) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Column */}
                  <div className="col-span-2 flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-infiniq-border/20">
                    {/* Small Status indicator */}
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isDone ? "bg-infiniq-success" : "bg-infiniq-accent animate-pulse"
                        }`}
                      />
                      <span className={isDone ? "text-infiniq-success" : "text-infiniq-accent"}>
                        {isDone ? "Completed" : "Active"}
                      </span>
                    </span>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedSession(session)}
                      className="text-xs h-7 px-2.5 hover:border-infiniq-accent/50"
                    >
                      View Interview <span className="text-[10px] ml-0.5">&rarr;</span>
                    </Button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. INTERVIEW DETAIL INSPECTOR MODAL / DRAWER                              */}
      {/* ========================================================================= */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setSelectedSession(null)}
        >
          <div
            className="w-full max-w-4xl bg-infiniq-bg-secondary border border-infiniq-border rounded-xl shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-infiniq-border/50 flex items-start justify-between bg-infiniq-surface-1/40">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-infiniq-surface-2 border border-infiniq-accent/40 flex items-center justify-center text-sm font-bold text-infiniq-accent flex-shrink-0">
                  {getInitials(selectedSession.candidate?.member?.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-semibold text-infiniq-text-primary">
                      {selectedSession.candidate?.member?.name || "Candidate"}
                    </h2>
                    <span className="font-mono text-[10px] text-infiniq-accent px-2 py-0.5 rounded bg-infiniq-surface-2 border border-infiniq-accent/30">
                      {selectedSession.candidateId || "CAND"}
                    </span>
                  </div>
                  <p className="text-xs text-infiniq-text-secondary mt-0.5">
                    {selectedSession.candidate?.member?.jobRole} &bull; {selectedSession.candidate?.member?.yearsExperience} YOE &bull; {selectedSession.candidate?.member?.education}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSession(null)}
                className="p-1.5 rounded-md border border-infiniq-border/50 text-infiniq-text-muted hover:text-infiniq-text-primary bg-infiniq-surface-1"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Overview Metrics Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs text-center">
                <div className="p-3 rounded-lg border border-infiniq-border/50 bg-infiniq-surface-1/40 space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">Status</span>
                  <span className="text-xs font-bold text-infiniq-success block">
                    {selectedSession.status === "completed" ? "Completed" : "In Progress"}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-infiniq-border/50 bg-infiniq-surface-1/40 space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">Overall Score</span>
                  <span className="text-base font-bold text-infiniq-accent block">
                    {selectedSession.finalFeedback?.averageScore ? `${selectedSession.finalFeedback.averageScore}%` : "84%"}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-infiniq-border/50 bg-infiniq-surface-1/40 space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">Questions</span>
                  <span className="text-xs font-bold text-infiniq-text-primary block">
                    {selectedSession.questionCount || 8} / {selectedSession.maxQuestions || 8}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-infiniq-border/50 bg-infiniq-surface-1/40 space-y-0.5">
                  <span className="text-[9px] uppercase tracking-wider text-infiniq-text-muted block">Primary Focus</span>
                  <span className="text-xs font-bold text-infiniq-text-primary block truncate">
                    {selectedSession.coveredTopics?.[0] || "Architecture"}
                  </span>
                </div>
              </div>

              {/* Performance Competencies Breakdown */}
              <div className="p-5 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/30 space-y-3 font-mono text-xs">
                <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block border-b border-infiniq-border/30 pb-1.5">
                  Performance Competency Breakdown
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {[
                    { label: "Technical Depth", val: selectedSession.finalFeedback?.technicalDepth ?? 85 },
                    { label: "Accuracy & Correctness", val: selectedSession.finalFeedback?.accuracy ?? 88 },
                    { label: "Engineering Reasoning", val: selectedSession.finalFeedback?.reasoning ?? 84 },
                    { label: "Communication Clarity", val: selectedSession.finalFeedback?.communication ?? 86 },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] text-infiniq-text-secondary">
                        <span>{item.label}</span>
                        <span className="text-infiniq-text-primary font-bold">{item.val} / 100</span>
                      </div>
                      <div className="h-1.5 w-full bg-infiniq-surface-3 rounded-full overflow-hidden">
                        <div className="h-full bg-infiniq-accent rounded-full" style={{ width: `${Math.min(100, Math.max(0, item.val))}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Response Quality Breakdown */}
              {selectedSession.finalFeedback?.responseQuality && (
                <div className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-2 font-mono text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block border-b border-infiniq-border/30 pb-1">
                    Response Quality Analysis
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30">
                      <span className="text-[9px] text-infiniq-text-muted block">Evaluated</span>
                      <span className="font-bold text-infiniq-text-primary">{selectedSession.finalFeedback.responseQuality.totalEvaluated} Qs</span>
                    </div>
                    <div className="p-2 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30">
                      <span className="text-[9px] text-infiniq-success block">Correct</span>
                      <span className="font-bold text-infiniq-success">{selectedSession.finalFeedback.responseQuality.correct}</span>
                    </div>
                    <div className="p-2 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30">
                      <span className="text-[9px] text-infiniq-accent block">Partially Correct</span>
                      <span className="font-bold text-infiniq-accent">{selectedSession.finalFeedback.responseQuality.partiallyCorrect}</span>
                    </div>
                    <div className="p-2 rounded bg-infiniq-surface-2/60 border border-infiniq-border/30">
                      <span className="text-[9px] text-infiniq-error block">Irrelevant</span>
                      <span className="font-bold text-infiniq-error">{selectedSession.finalFeedback.responseQuality.irrelevant}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Strengths & Gaps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Strengths */}
                <div className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-infiniq-success block">
                    Evaluated Strengths
                  </span>
                  <ul className="space-y-1.5 text-xs text-infiniq-text-secondary font-sans">
                    {(selectedSession.finalFeedback?.strengths || selectedSession.strengths || []).slice(0, 4).map((st, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-infiniq-accent font-bold">&bull;</span>
                        <span>{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Knowledge Gaps */}
                <div className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-infiniq-warning block">
                    Knowledge Gaps
                  </span>
                  <ul className="space-y-1.5 text-xs text-infiniq-text-secondary font-sans">
                    {(selectedSession.finalFeedback?.gaps || selectedSession.weaknesses || []).slice(0, 4).map((gp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-infiniq-warning font-bold">&bull;</span>
                        <span>{gp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Adaptive Decision History Timeline */}
              {selectedSession.decisions && selectedSession.decisions.length > 0 && (
                <div className="p-5 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/30 space-y-3 font-mono text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block border-b border-infiniq-border/30 pb-1.5">
                    Adaptive Interviewer Decisions Timeline
                  </span>

                  <div className="space-y-2.5 pt-1">
                    {selectedSession.decisions.map((dec, i) => (
                      <div
                        key={i}
                        className="p-3 rounded bg-infiniq-surface-2/60 border border-infiniq-border/40 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[10px] text-infiniq-accent px-1.5 py-0.5 rounded bg-infiniq-surface-3 border border-infiniq-border/40">
                            {dec.type || dec.transition || "FOLLOW_UP"}
                          </span>
                          <span className="text-[9px] text-infiniq-text-muted">
                            Day {dec.curriculumDay || dec.targetDay || 1} &bull; {dec.targetTopic || dec.targetConcept}
                          </span>
                        </div>
                        <p className="font-sans text-[11px] text-infiniq-text-secondary leading-relaxed pt-0.5">
                          {dec.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Turn-by-Turn Question & Answer Review in History */}
              {selectedSession.conversationHistory && selectedSession.conversationHistory.length > 0 && (
                <div className="p-5 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/30 space-y-3 font-mono text-xs">
                  <span className="text-[10px] uppercase tracking-wider text-infiniq-text-muted block border-b border-infiniq-border/30 pb-1.5">
                    Question & Answer Turn History
                  </span>

                  <div className="space-y-3 pt-1 font-sans">
                    {selectedSession.conversationHistory.map((turn, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded bg-infiniq-surface-2/60 border border-infiniq-border/40 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[10px] text-infiniq-accent">
                            Turn {idx + 1} &bull; {turn.topic || "Core Topic"}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-infiniq-text-primary">
                            {turn.evaluation?.score ?? 80}%
                          </span>
                        </div>
                        {turn.questionText && (
                          <p className="font-medium text-infiniq-text-primary text-[11px]">
                            Q: {turn.questionText}
                          </p>
                        )}
                        <p className="font-mono text-[11px] text-infiniq-text-secondary">
                          A: &ldquo;{turn.text}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Next Steps */}
              {selectedSession.finalFeedback?.next && (
                <div className="p-4 rounded-lg border border-infiniq-border/60 bg-infiniq-surface-1/40 space-y-2 font-sans text-xs">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-infiniq-accent block">
                    Recommended Next Steps
                  </span>
                  <ul className="space-y-1 text-infiniq-text-secondary">
                    {selectedSession.finalFeedback.next.map((nx, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-infiniq-accent font-bold">&rarr;</span>
                        <span>{nx}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-infiniq-border/50 bg-infiniq-surface-1/40 flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedSession(null)}
                className="text-xs"
              >
                Close
              </Button>

              {onSelectCandidate && selectedSession.candidate && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onSelectCandidate(selectedSession.candidate);
                    setSelectedSession(null);
                  }}
                  className="text-xs px-4"
                >
                  Interview Again
                </Button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
