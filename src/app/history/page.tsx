"use client";

import React, { useState } from "react";
import Sidebar, { SidebarTab } from "@/components/layout/Sidebar";
import InterviewHistoryView from "@/components/history/InterviewHistoryView";
import { useRouter } from "next/navigation";

export default function StandaloneHistoryPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SidebarTab>("history");

  return (
    <div className="min-h-screen bg-infiniq-bg text-infiniq-text-primary flex flex-col lg:flex-row selection:bg-infiniq-accent/20 selection:text-infiniq-accent-highlight">
      <Sidebar
        activeTab="history"
        onTabChange={(tab) => {
          if (tab === "history") return;
          router.push(`/interview?tab=${tab}`);
        }}
      />

      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto">
        <InterviewHistoryView
          onStartNewInterview={() => router.push("/interview?tab=candidates")}
          onSelectCandidate={(candidate) => {
            router.push(`/interview?tab=briefing`);
          }}
        />
      </div>
    </div>
  );
}
