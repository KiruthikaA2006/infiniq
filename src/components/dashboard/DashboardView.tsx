"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Candidate } from "@/data/candidate";
import { CurriculumDay } from "@/data/curriculum";
import { InterviewSession } from "@/types/interview";
import {
  Users,
  BookOpen,
  Activity,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  UserPlus,
  AlertOctagon,
  Star,
  Target,
  Check
} from "lucide-react";

interface DashboardViewProps {
  candidates?: Candidate[];
  selectedCandidate?: Candidate | null;
  onSelectCandidate?: (candidate: Candidate) => void;
  onStartInterview?: (candidate: Candidate) => void;
  onNavigate?: (tab: "candidates" | "history" | "reports" | "chamber" | "briefing" | "settings") => void;
}

export type TimeFilter = "7d" | "14d" | "30d" | "all";

export default function DashboardView({
  candidates: initialCandidates = [],
  selectedCandidate,
  onSelectCandidate,
  onStartInterview,
  onNavigate,
}: DashboardViewProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);

  // Time filter states
  const [chartFilter, setChartFilter] = useState<TimeFilter>("7d");
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const [headerDateFilter, setHeaderDateFilter] = useState<TimeFilter>("7d");
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);

  const chartDropdownRef = useRef<HTMLDivElement>(null);
  const headerDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(event.target as Node)) {
        setChartDropdownOpen(false);
      }
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target as Node)) {
        setHeaderDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load real candidates and sessions
  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        // 1. Fetch Candidates if not passed in
        let candData = initialCandidates;
        if (candData.length === 0) {
          const resCand = await fetch("/api/candidates");
          if (resCand.ok) {
            candData = await resCand.json();
            setCandidates(candData);
          }
        }

        // 2. Fetch Interview Sessions
        const resSessions = await fetch("/api/interview");
        let sessionData: InterviewSession[] = [];
        if (resSessions.ok) {
          sessionData = await resSessions.json();
        }

        // Merge localStorage sessions
        try {
          const localStored = localStorage.getItem("infiniq_local_sessions");
          if (localStored) {
            const parsed: InterviewSession[] = JSON.parse(localStored);
            const sessionMap = new Map<string, InterviewSession>();
            sessionData.forEach((s) => sessionMap.set(s.id, s));
            parsed.forEach((s) => sessionMap.set(s.id, s));
            sessionData = Array.from(sessionMap.values());
          }
        } catch (e) {
          console.warn("Error reading localStorage:", e);
        }

        setSessions(sessionData);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [initialCandidates]);

  // Spotlight Candidate (Sarah Johnson or current selection)
  const spotlightCandidate = selectedCandidate || (candidates.length > 0 ? candidates[0] : null);

  // Derived real scores
  const metrics = useMemo(() => {
    const totalCandidates = candidates.length || 20;
    const scores = sessions
      .map((s) => s.finalFeedback?.averageScore || 0)
      .filter((sc) => sc > 0);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 68;

    return {
      totalCandidates,
      avgScore,
      totalSessions: sessions.length || 3,
    };
  }, [candidates, sessions]);

  // Dynamic Chart Datasets based on selected chart filter
  const chartData = useMemo(() => {
    switch (chartFilter) {
      case "14d":
        return {
          dates: ["May 4", "May 6", "May 8", "May 10", "May 12", "May 14", "May 17"],
          completed: [6, 12, 18, 23, 27, 32, 36],
          inProgress: [3, 6, 8, 11, 14, 15, 17],
          interrupted: [0, 1, 2, 2, 3, 4, 5],
          completedY: [110, 95, 82, 72, 62, 50, 40],
          inProgressY: [118, 110, 102, 94, 88, 85, 78],
          interruptedY: [125, 123, 121, 121, 118, 116, 114],
        };
      case "30d":
        return {
          dates: ["Apr 18", "Apr 23", "Apr 28", "May 3", "May 8", "May 13", "May 17"],
          completed: [3, 9, 16, 22, 28, 33, 39],
          inProgress: [2, 4, 7, 10, 13, 16, 19],
          interrupted: [0, 1, 1, 2, 3, 4, 6],
          completedY: [118, 102, 86, 74, 60, 48, 35],
          inProgressY: [121, 115, 106, 96, 90, 82, 75],
          interruptedY: [125, 123, 123, 121, 118, 116, 111],
        };
      case "all":
        return {
          dates: ["Day 1", "Day 5", "Day 10", "Day 15", "Day 20", "Day 25", "Day 31"],
          completed: [1, 6, 14, 21, 29, 36, 42],
          inProgress: [1, 3, 6, 10, 14, 18, 22],
          interrupted: [0, 0, 1, 2, 3, 5, 7],
          completedY: [123, 110, 90, 76, 58, 42, 28],
          inProgressY: [123, 118, 110, 96, 88, 78, 68],
          interruptedY: [125, 125, 123, 121, 118, 114, 108],
        };
      case "7d":
      default:
        return {
          dates: ["May 11", "May 12", "May 13", "May 14", "May 15", "May 16", "May 17"],
          completed: [10, 22, 24, 28, 31, 33, 35],
          inProgress: [5, 9, 10, 15, 14, 14, 16],
          interrupted: [1, 2, 2, 3, 3, 3, 4],
          completedY: [115, 80, 75, 68, 55, 48, 42],
          inProgressY: [120, 110, 95, 95, 95, 90, 82],
          interruptedY: [125, 124, 124, 123, 123, 123, 120],
        };
    }
  }, [chartFilter]);

  const timeFilterLabels: Record<TimeFilter, { label: string; headerText: string }> = {
    "7d": { label: "Last 7 Days", headerText: "May 11 – May 17, 2025" },
    "14d": { label: "Last 14 Days", headerText: "May 4 – May 17, 2025" },
    "30d": { label: "Last 30 Days", headerText: "Apr 18 – May 17, 2025" },
    "all": { label: "All Time", headerText: "Day 1 – Day 31 (All Time)" },
  };

  const handleExportReport = () => {
    window.print();
  };

  // Build SVG path string from coordinates
  const completedPath = `M 30 ${chartData.completedY[0]} C 60 ${chartData.completedY[1]}, 90 ${chartData.completedY[2]}, 135 ${chartData.completedY[2]} C 170 ${chartData.completedY[3]}, 210 ${chartData.completedY[4]}, 245 ${chartData.completedY[4]} C 285 ${chartData.completedY[5]}, 325 ${chartData.completedY[6]}, 365 ${chartData.completedY[6]}`;
  const inProgressPath = `M 30 ${chartData.inProgressY[0]} C 60 ${chartData.inProgressY[1]}, 90 ${chartData.inProgressY[2]}, 135 ${chartData.inProgressY[2]} C 170 ${chartData.inProgressY[3]}, 210 ${chartData.inProgressY[4]}, 245 ${chartData.inProgressY[4]} C 285 ${chartData.inProgressY[5]}, 325 ${chartData.inProgressY[6]}, 365 ${chartData.inProgressY[6]}`;
  const interruptedPath = `M 30 ${chartData.interruptedY[0]} C 80 ${chartData.interruptedY[1]}, 130 ${chartData.interruptedY[2]}, 190 ${chartData.interruptedY[3]} C 250 ${chartData.interruptedY[4]}, 310 ${chartData.interruptedY[5]}, 365 ${chartData.interruptedY[6]}`;

  const xPositions = [30, 80, 135, 190, 245, 305, 365];

  return (
    <div className="p-6 lg:p-8 space-y-5 max-w-[1440px] mx-auto w-full text-left font-sans select-none bg-[#0D0E0D] text-[#EDEDE8]">
      
      {/* ========================================================================= */}
      {/* 1. DASHBOARD HEADER                                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#F3EFE0] tracking-tight">
            Platform Dashboard
          </h1>
          <p className="text-xs text-[#8E8F86] mt-0.5 font-normal">
            Real-time overview of interviews, candidates, and assessment intelligence.
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Header Date Range Dropdown */}
          <div className="relative" ref={headerDropdownRef}>
            <button
              onClick={() => setHeaderDropdownOpen(!headerDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#262724] bg-[#141514] text-xs text-[#C5C6BC] cursor-pointer hover:border-[#D7CE83]/50 transition-colors"
              aria-label="Filter Date Range"
            >
              <Calendar size={13} className="text-[#8E8F86]" />
              <span className="font-sans text-xs">{timeFilterLabels[headerDateFilter].headerText}</span>
              <ChevronDown size={12} className={`text-[#8E8F86] transition-transform ${headerDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {headerDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 rounded-lg bg-[#181918] border border-[#2D2E2B] shadow-xl py-1 z-50 text-xs font-sans">
                {(["7d", "14d", "30d", "all"] as TimeFilter[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      setHeaderDateFilter(key);
                      setChartFilter(key);
                      setHeaderDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-[#212220] transition-colors cursor-pointer ${
                      headerDateFilter === key ? "text-[#D7CE83] font-semibold bg-[#1C1D1B]" : "text-[#C5C6BC]"
                    }`}
                  >
                    <span>{timeFilterLabels[key].headerText}</span>
                    {headerDateFilter === key && <Check size={12} className="text-[#D7CE83]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Export Report Button */}
          <button
            onClick={handleExportReport}
            className="px-3.5 py-1.5 rounded-lg border border-[#3A3B35] bg-[#141514] hover:bg-[#1B1C1A] hover:border-[#D7CE83]/60 text-xs font-medium text-[#F3EFE0] transition-all cursor-pointer shadow-xs"
          >
            Export Report
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 4 KPI CARDS                                                        */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Card 1: Available Candidates */}
        <div
          onClick={() => onNavigate?.("candidates")}
          className="p-4 rounded-xl border border-[#21221F] bg-[#131413] hover:border-[#D7CE83]/40 transition-all cursor-pointer flex justify-between items-start"
        >
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7E8076] font-semibold block">
              Available Candidates
            </span>
            <div className="text-2xl font-bold text-[#F3EFE0]">
              {metrics.totalCandidates}
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-[#5FA574] font-medium pt-0.5">
              <span>&uarr; 12% vs last 7 days</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#1B1C19] border border-[#2D2E2A] flex items-center justify-center text-[#D7CE83] flex-shrink-0">
            <Users size={16} />
          </div>
        </div>

        {/* Card 2: Curriculum Depth */}
        <div className="p-4 rounded-xl border border-[#21221F] bg-[#131413] hover:border-[#D7CE83]/40 transition-all flex justify-between items-start">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7E8076] font-semibold block">
              Curriculum Depth
            </span>
            <div className="text-2xl font-bold text-[#F3EFE0]">
              31 Modules
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-[#D7CE83] font-medium pt-0.5">
              <span>&#9889; 5 Tracks</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#1B1C19] border border-[#2D2E2A] flex items-center justify-center text-[#D7CE83] flex-shrink-0">
            <BookOpen size={16} />
          </div>
        </div>

        {/* Card 3: Engine Status */}
        <div className="p-4 rounded-xl border border-[#21221F] bg-[#131413] hover:border-[#5FA574]/40 transition-all flex justify-between items-start">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7E8076] font-semibold block">
              Engine Status
            </span>
            <div className="text-2xl font-bold text-[#5FA574]">
              Active
            </div>
            <div className="font-mono text-[10px] text-[#7E8076] pt-0.5">
              All systems operational
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#161B16] border border-[#263326] flex items-center justify-center text-[#5FA574] flex-shrink-0">
            <Activity size={16} />
          </div>
        </div>

        {/* Card 4: AI Provider */}
        <div className="p-4 rounded-xl border border-[#21221F] bg-[#131413] hover:border-[#D7CE83]/40 transition-all flex justify-between items-start">
          <div className="space-y-1">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#7E8076] font-semibold block">
              AI Provider
            </span>
            <div className="text-2xl font-bold text-[#F3EFE0]">
              Adaptive
            </div>
            <div className="font-mono text-[10px] text-[#7E8076] pt-0.5">
              Dynamic difficulty enabled
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-[#1B1C19] border border-[#2D2E2A] flex items-center justify-center text-[#D7CE83] flex-shrink-0">
            <Sparkles size={16} />
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. 3 QUICK ACCESS CARDS (HORIZONTAL ROW)                                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Quick Card 1: Candidate Roster */}
        <div
          onClick={() => onNavigate?.("candidates")}
          className="p-4 rounded-xl border border-[#21221F] bg-[#131413] hover:border-[#D7CE83]/50 hover:bg-[#161715] transition-all cursor-pointer group flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
              Candidate Roster
            </h3>
            <ChevronRight size={14} className="text-[#7E8076] group-hover:text-[#D7CE83] group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-sans text-[11px] text-[#8E8F86] leading-relaxed">
            Browse candidate profiles, mission history, and start new personalized interviews.
          </p>
        </div>

        {/* Quick Card 2: Interview History */}
        <div
          onClick={() => onNavigate?.("history")}
          className="p-4 rounded-xl border border-[#21221F] bg-[#131413] hover:border-[#D7CE83]/50 hover:bg-[#161715] transition-all cursor-pointer group flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
              Interview History
            </h3>
            <ChevronRight size={14} className="text-[#7E8076] group-hover:text-[#D7CE83] group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-sans text-[11px] text-[#8E8F86] leading-relaxed">
            Review completed interviews, scorecards, and interviewer decision logs.
          </p>
        </div>

        {/* Quick Card 3: Evaluation Reports */}
        <div
          onClick={() => onNavigate?.("reports")}
          className="p-4 rounded-xl border border-[#21221F] bg-[#131413] hover:border-[#D7CE83]/50 hover:bg-[#161715] transition-all cursor-pointer group flex flex-col justify-between space-y-2"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
              Evaluation Reports
            </h3>
            <ChevronRight size={14} className="text-[#7E8076] group-hover:text-[#D7CE83] group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-sans text-[11px] text-[#8E8F86] leading-relaxed">
            Examine detailed competency rubrics, technical depth, and candidate recommendations.
          </p>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. MAIN ANALYTICS ROW (3 COLUMNS: LINE CHART | DONUT | RECENT ACTIVITY)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
        
        {/* COL 1 (Col 5): Interviews Overview Line Chart */}
        <div className="lg:col-span-5 p-4 rounded-xl border border-[#21221F] bg-[#131413] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
              Interviews Overview
            </h3>

            {/* Interactive "Last 7 Days" Dropdown Filter */}
            <div className="relative" ref={chartDropdownRef}>
              <button
                onClick={() => setChartDropdownOpen(!chartDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1A1B19] border border-[#2A2B27] hover:border-[#D7CE83]/50 text-[10px] text-[#A6A79D] hover:text-[#F3EFE0] transition-colors cursor-pointer"
                aria-label="Toggle timeframe filter"
              >
                <span>{timeFilterLabels[chartFilter].label}</span>
                <ChevronDown size={11} className={`text-[#7E8076] transition-transform ${chartDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {chartDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-36 rounded-lg bg-[#181918] border border-[#2D2E2B] shadow-xl py-1 z-50 text-[11px] font-sans">
                  {(["7d", "14d", "30d", "all"] as TimeFilter[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        setChartFilter(key);
                        setHeaderDateFilter(key);
                        setChartDropdownOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-[#212220] transition-colors cursor-pointer ${
                        chartFilter === key ? "text-[#D7CE83] font-semibold bg-[#1C1D1B]" : "text-[#C5C6BC]"
                      }`}
                    >
                      <span>{timeFilterLabels[key].label}</span>
                      {chartFilter === key && <Check size={11} className="text-[#D7CE83]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3.5 font-sans text-[10px] text-[#8E8F86]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#5FA574]" />
              Completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D7CE83]" />
              In Progress
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#B85C5E]" />
              Interrupted
            </span>
          </div>

          {/* Multi-line Line Chart */}
          <div className="relative pt-2 pb-1 flex-grow flex flex-col justify-end">
            <svg viewBox="0 0 380 140" className="w-full h-36 overflow-visible font-mono text-[8px]">
              {/* Grid Lines & Y-axis labels */}
              {[
                { y: 15, label: "40" },
                { y: 45, label: "30" },
                { y: 75, label: "20" },
                { y: 105, label: "10" },
                { y: 125, label: "0" },
              ].map((grid, idx) => (
                <g key={idx}>
                  <text x="0" y={grid.y + 3} fill="#5C5E57" fontSize="7">
                    {grid.label}
                  </text>
                  <line x1="20" y1={grid.y} x2="375" y2={grid.y} stroke="#1C1D1A" strokeDasharray={idx < 4 ? "2 2" : "0"} />
                </g>
              ))}

              {/* Line 1: Completed (Green Curve) */}
              <path
                d={completedPath}
                fill="none"
                stroke="#5FA574"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              {/* Green Data Nodes */}
              {xPositions.map((x, i) => (
                <g key={`g-comp-${i}`} className="cursor-pointer group" onMouseEnter={() => setActiveTooltipIndex(i)} onMouseLeave={() => setActiveTooltipIndex(null)}>
                  <circle cx={x} cy={chartData.completedY[i]} r="3" fill="#5FA574" stroke="#131413" strokeWidth="1.5" />
                </g>
              ))}

              {/* Line 2: In Progress (Gold Curve) */}
              <path
                d={inProgressPath}
                fill="none"
                stroke="#D7CE83"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              {/* Gold Data Nodes */}
              {xPositions.map((x, i) => (
                <g key={`g-inp-${i}`} className="cursor-pointer group" onMouseEnter={() => setActiveTooltipIndex(i)} onMouseLeave={() => setActiveTooltipIndex(null)}>
                  <circle cx={x} cy={chartData.inProgressY[i]} r="3" fill="#D7CE83" stroke="#131413" strokeWidth="1.5" />
                </g>
              ))}

              {/* Line 3: Interrupted (Coral Curve) */}
              <path
                d={interruptedPath}
                fill="none"
                stroke="#B85C5E"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-300"
              />
              {/* Coral Data Nodes */}
              {xPositions.map((x, i) => (
                <g key={`g-int-${i}`} className="cursor-pointer group" onMouseEnter={() => setActiveTooltipIndex(i)} onMouseLeave={() => setActiveTooltipIndex(null)}>
                  <circle cx={x} cy={chartData.interruptedY[i]} r="2.5" fill="#B85C5E" stroke="#131413" strokeWidth="1.5" />
                </g>
              ))}

              {/* X-axis Dates */}
              {chartData.dates.map((dateLabel, idx) => (
                <text key={idx} x={xPositions[idx] - 12} y="137" fill="#5C5E57" fontSize="7">
                  {dateLabel}
                </text>
              ))}
            </svg>

            {/* Hover Tooltip Overlay */}
            {activeTooltipIndex !== null && (
              <div className="absolute top-2 right-2 px-2.5 py-1.5 rounded bg-[#1C1D1A] border border-[#30312D] text-[10px] font-mono shadow-lg pointer-events-none space-y-0.5 animate-fadeIn">
                <div className="text-[#8E8F86] font-bold">{chartData.dates[activeTooltipIndex]}</div>
                <div className="text-[#5FA574]">Completed: {chartData.completed[activeTooltipIndex]}</div>
                <div className="text-[#D7CE83]">In Progress: {chartData.inProgress[activeTooltipIndex]}</div>
                <div className="text-[#B85C5E]">Interrupted: {chartData.interrupted[activeTooltipIndex]}</div>
              </div>
            )}
          </div>
        </div>

        {/* COL 2 (Col 4): Candidate Performance Distribution */}
        <div className="lg:col-span-4 p-4 rounded-xl border border-[#21221F] bg-[#131413] flex flex-col justify-between space-y-3">
          <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
            Candidate Performance Distribution
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-1">
            {/* Donut Chart with Center Score */}
            <div className="relative w-28 h-28 flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
              <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                <circle cx="60" cy="60" r="46" fill="none" stroke="#1F201D" strokeWidth="15" />
                {/* Segment 1: Excellent (Green 24%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#5FA574"
                  strokeWidth="15"
                  strokeDasharray="69 289"
                  strokeDashoffset="0"
                />
                {/* Segment 2: Good (Gold 36%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#D7CE83"
                  strokeWidth="15"
                  strokeDasharray="104 289"
                  strokeDashoffset="-69"
                />
                {/* Segment 3: Fair (Brown/Amber 28%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#A87E4B"
                  strokeWidth="15"
                  strokeDasharray="81 289"
                  strokeDashoffset="-173"
                />
                {/* Segment 4: Needs Improvement (Coral 12%) */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#B85C5E"
                  strokeWidth="15"
                  strokeDasharray="35 289"
                  strokeDashoffset="-254"
                />
              </svg>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-sans text-[8px] text-[#8E8F86]">Avg. Score</span>
                <span className="font-sans text-sm font-bold text-[#F3EFE0] leading-none mt-0.5">
                  <strong className="text-[#5FA574]">{metrics.avgScore}</strong>
                  <span className="text-[10px] text-[#8E8F86]">/100</span>
                </span>
              </div>
            </div>

            {/* Right Legend */}
            <div className="space-y-2 font-sans text-[11px] w-full sm:w-auto flex-grow sm:pl-2">
              <div className="flex items-center justify-between text-[#8E8F86] gap-2">
                <span className="flex items-center gap-1.5 text-[#C5C6BC] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5FA574] flex-shrink-0" />
                  Excellent (80–100)
                </span>
                <span className="font-mono text-[10px] text-[#F3EFE0] font-bold">24%</span>
              </div>
              <div className="flex items-center justify-between text-[#8E8F86] gap-2">
                <span className="flex items-center gap-1.5 text-[#C5C6BC] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D7CE83] flex-shrink-0" />
                  Good (60–79)
                </span>
                <span className="font-mono text-[10px] text-[#F3EFE0] font-bold">36%</span>
              </div>
              <div className="flex items-center justify-between text-[#8E8F86] gap-2">
                <span className="flex items-center gap-1.5 text-[#C5C6BC] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A87E4B] flex-shrink-0" />
                  Fair (40–59)
                </span>
                <span className="font-mono text-[10px] text-[#F3EFE0] font-bold">28%</span>
              </div>
              <div className="flex items-center justify-between text-[#8E8F86] gap-2">
                <span className="flex items-center gap-1.5 text-[#C5C6BC] truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B85C5E] flex-shrink-0" />
                  Needs Improvement (&lt;40)
                </span>
                <span className="font-mono text-[10px] text-[#F3EFE0] font-bold">12%</span>
              </div>
            </div>
          </div>
        </div>

        {/* COL 3 (Col 3): Recent Activity Timeline */}
        <div className="lg:col-span-3 p-4 rounded-xl border border-[#21221F] bg-[#131413] flex flex-col justify-between space-y-3">
          <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
            Recent Activity
          </h3>

          <div className="space-y-3 font-sans text-xs flex-grow relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-[#20211E]">
            {/* Event 1 */}
            <div className="flex items-start gap-2.5 relative">
              <div className="w-6 h-6 rounded-full bg-[#172018] border border-[#29422C] flex items-center justify-center text-[#5FA574] flex-shrink-0 z-10">
                <CheckCircle2 size={11} />
              </div>
              <div className="min-w-0">
                <div className="text-[#F3EFE0] text-[11px] font-medium leading-tight">Interview completed</div>
                <div className="text-[#7E8076] text-[10px]">Sarah Johnson &bull; 2m ago</div>
              </div>
            </div>

            {/* Event 2 */}
            <div className="flex items-start gap-2.5 relative">
              <div className="w-6 h-6 rounded-full bg-[#181C19] border border-[#2E362F] flex items-center justify-center text-[#94A882] flex-shrink-0 z-10">
                <UserPlus size={11} />
              </div>
              <div className="min-w-0">
                <div className="text-[#F3EFE0] text-[11px] font-medium leading-tight">New candidate added</div>
                <div className="text-[#7E8076] text-[10px]">Arjun Patel &bull; 15m ago</div>
              </div>
            </div>

            {/* Event 3 */}
            <div className="flex items-start gap-2.5 relative">
              <div className="w-6 h-6 rounded-full bg-[#201818] border border-[#422929] flex items-center justify-center text-[#B85C5E] flex-shrink-0 z-10">
                <AlertOctagon size={11} />
              </div>
              <div className="min-w-0">
                <div className="text-[#F3EFE0] text-[11px] font-medium leading-tight">Interview interrupted</div>
                <div className="text-[#7E8076] text-[10px]">Michael Lee &bull; 32m ago</div>
              </div>
            </div>

            {/* Event 4 */}
            <div className="flex items-start gap-2.5 relative">
              <div className="w-6 h-6 rounded-full bg-[#1F1E16] border border-[#423E29] flex items-center justify-center text-[#D7CE83] flex-shrink-0 z-10">
                <FileText size={11} />
              </div>
              <div className="min-w-0">
                <div className="text-[#F3EFE0] text-[11px] font-medium leading-tight">Report generated</div>
                <div className="text-[#7E8076] text-[10px]">Priya Sharma &bull; 1h ago</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate?.("history")}
            className="w-full py-1.5 rounded-lg border border-[#282925] bg-[#171816] hover:bg-[#1F201D] text-[#C5C6BC] text-[10px] font-medium transition-all text-center cursor-pointer"
          >
            View All Activity
          </button>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 5. SUB-ANALYTICS ROW (3 CARDS: CURRICULUM | SKILLS | DECISIONS)           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* Sub-Card 1: Curriculum Coverage */}
        <div className="p-4 rounded-xl border border-[#21221F] bg-[#131413] flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
                Curriculum Coverage
              </h3>
              <p className="font-sans text-[10px] text-[#7E8076]">
                Track coverage across curriculum modules
              </p>
            </div>
            <button
              onClick={() => onNavigate?.("briefing")}
              className="px-2 py-0.5 rounded border border-[#2A2B27] bg-[#1A1B19] text-[9px] text-[#8E8F86] hover:text-[#F3EFE0] transition-colors cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="space-y-2.5 font-sans text-xs">
            {[
              { name: "AI Engineering Fundamentals", pct: 92 },
              { name: "Advanced RAG Systems", pct: 78 },
              { name: "Agentic AI & Tools", pct: 65 },
              { name: "Production AI Systems", pct: 54 },
              { name: "Observability & Evaluation", pct: 40 },
            ].map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#C5C6BC]">{item.name}</span>
                  <span className="font-mono text-[10px] font-bold text-[#F3EFE0]">{item.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1E1F1C] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#5FA574]"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Card 2: Top Skills Assessed */}
        <div className="p-4 rounded-xl border border-[#21221F] bg-[#131413] flex flex-col justify-between space-y-3">
          <div>
            <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
              Top Skills Assessed
            </h3>
            <p className="font-sans text-[10px] text-[#7E8076]">
              Based on interview evaluations
            </p>
          </div>

          <div className="space-y-2.5 font-sans text-xs">
            {[
              { name: "System Design", pct: 72 },
              { name: "Python", pct: 68 },
              { name: "Machine Learning", pct: 65 },
              { name: "Problem Solving", pct: 60 },
              { name: "Communication", pct: 55 },
            ].map((skill, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#C5C6BC]">{skill.name}</span>
                  <span className="font-mono text-[10px] font-bold text-[#F3EFE0]">{skill.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1E1F1C] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#D7CE83]"
                    style={{ width: `${skill.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-Card 3: Interviewer Decisions */}
        <div className="p-4 rounded-xl border border-[#21221F] bg-[#131413] flex flex-col justify-between space-y-3">
          <div>
            <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
              Interviewer Decisions
            </h3>
            <p className="font-sans text-[10px] text-[#7E8076]">
              Decision breakdown
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 py-1">
            {/* Donut Chart with Center Total */}
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
                <circle cx="60" cy="60" r="46" fill="none" stroke="#1F201D" strokeWidth="15" />
                {/* Follow-up: 42% */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#5FA574"
                  strokeWidth="15"
                  strokeDasharray="121 289"
                  strokeDashoffset="0"
                />
                {/* New Topic: 28% */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#D7CE83"
                  strokeWidth="15"
                  strokeDasharray="81 289"
                  strokeDashoffset="-121"
                />
                {/* Deeper Challenge: 20% */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#A87E4B"
                  strokeWidth="15"
                  strokeDasharray="58 289"
                  strokeDashoffset="-202"
                />
                {/* Foundation Repair: 10% */}
                <circle
                  cx="60"
                  cy="60"
                  r="46"
                  fill="none"
                  stroke="#B85C5E"
                  strokeWidth="15"
                  strokeDasharray="29 289"
                  strokeDashoffset="-260"
                />
              </svg>

              {/* Center Total text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="font-sans text-[8px] text-[#8E8F86]">Total</span>
                <span className="font-sans text-xs font-bold text-[#F3EFE0] leading-tight">
                  248
                </span>
              </div>
            </div>

            {/* Right Legend */}
            <div className="space-y-1.5 font-sans text-[11px] flex-grow pl-2">
              <div className="flex items-center justify-between text-[#8E8F86]">
                <span className="flex items-center gap-1.5 text-[#C5C6BC]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5FA574]" />
                  Follow-up
                </span>
                <span className="font-mono text-[10px] text-[#F3EFE0] font-bold">42%</span>
              </div>
              <div className="flex items-center justify-between text-[#8E8F86]">
                <span className="flex items-center gap-1.5 text-[#C5C6BC]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D7CE83]" />
                  New Topic
                </span>
                <span className="font-mono text-[10px] text-[#F3EFE0] font-bold">28%</span>
              </div>
              <div className="flex items-center justify-between text-[#8E8F86]">
                <span className="flex items-center gap-1.5 text-[#C5C6BC]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A87E4B]" />
                  Deeper Challenge
                </span>
                <span className="font-mono text-[10px] text-[#F3EFE0] font-bold">20%</span>
              </div>
              <div className="flex items-center justify-between text-[#8E8F86]">
                <span className="flex items-center gap-1.5 text-[#C5C6BC]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B85C5E]" />
                  Foundation Repair
                </span>
                <span className="font-mono text-[10px] text-[#F3EFE0] font-bold">10%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 6. CANDIDATE SPOTLIGHT (WIDE BOTTOM CARD)                                 */}
      {/* ========================================================================= */}
      <div className="p-4 sm:p-5 rounded-xl border border-[#21221F] bg-[#131413] space-y-3">
        <h3 className="font-sans font-semibold text-xs text-[#F3EFE0]">
          Candidate Spotlight
        </h3>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
          
          {/* Candidate Profile */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1F201D] border border-[#3A3B35] flex items-center justify-center text-xs font-bold text-[#F3EFE0] overflow-hidden flex-shrink-0">
              {spotlightCandidate?.member?.name ? (
                <span>{spotlightCandidate.member.name.slice(0, 2).toUpperCase()}</span>
              ) : (
                <span>SJ</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-sans font-bold text-xs sm:text-sm text-[#F3EFE0]">
                  {spotlightCandidate?.member?.name || "Sarah Johnson"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#162117] border border-[#29422C] text-[#5FA574] text-[9px] font-medium">
                  Completed
                </span>
              </div>
              <p className="font-sans text-[11px] text-[#7E8076] mt-0.5">
                {spotlightCandidate?.member?.jobRole || "Senior Data Engineer"}
              </p>
            </div>
          </div>

          {/* Metrics Cluster */}
          <div className="flex flex-wrap items-center gap-6 sm:gap-8 font-sans text-xs">
            
            {/* Score */}
            <div>
              <span className="font-mono text-[9px] text-[#7E8076] block">Score</span>
              <div className="font-sans text-base font-bold text-[#5FA574] leading-tight">
                82<span className="text-xs text-[#7E8076]">/100</span>
              </div>
            </div>

            {/* Strength */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1B1C19] border border-[#2D2E2A] flex items-center justify-center text-[#D7CE83]">
                <Star size={13} />
              </div>
              <div>
                <span className="font-mono text-[9px] text-[#7E8076] block">Strength</span>
                <span className="font-medium text-[11px] text-[#F3EFE0]">
                  {spotlightCandidate?.signals?.strengthSignals?.[0] || "System Design"}
                </span>
              </div>
            </div>

            {/* Focus Area */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1B1C19] border border-[#2D2E2A] flex items-center justify-center text-[#D7CE83]">
                <Target size={13} />
              </div>
              <div>
                <span className="font-mono text-[9px] text-[#7E8076] block">Focus Area</span>
                <span className="font-medium text-[11px] text-[#D7CE83]">
                  {spotlightCandidate?.signals?.weaknessSignals?.[0] || "Scalability & Optimization"}
                </span>
              </div>
            </div>

          </div>

          {/* View Profile Button */}
          <button
            onClick={() => {
              if (spotlightCandidate) onSelectCandidate?.(spotlightCandidate);
              onNavigate?.("briefing");
            }}
            className="px-4 py-2 rounded-lg border border-[#3A3B35] bg-[#141514] hover:bg-[#1B1C1A] hover:border-[#D7CE83] text-xs font-medium text-[#F3EFE0] transition-all cursor-pointer shadow-xs self-start lg:self-auto"
          >
            View Profile
          </button>

        </div>
      </div>

    </div>
  );
}
