"use client";

import React, { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/ui/BrandLogo";
import {
  LayoutDashboard,
  Users,
  History,
  FileText,
  Settings,
  Terminal,
  Layers,
  Activity,
  BookOpen,
  ChevronDown,
  Menu,
  X
} from "lucide-react";

export type SidebarTab = "candidates" | "briefing" | "chamber" | "progress" | "assessment" | "dashboard" | "history" | "reports" | "settings";

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange?: (tab: SidebarTab) => void;
  isChamberMode?: boolean;
  className?: string;
}

export default function Sidebar({
  activeTab,
  onTabChange,
  isChamberMode = false,
  className = "",
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const standardNavItems: { id: SidebarTab; label: string; icon: any }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "candidates", label: "Candidates", icon: Users },
    { id: "history", label: "Interview History", icon: History },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const chamberNavItems: { id: SidebarTab; label: string; icon: any }[] = [
    { id: "chamber", label: "Chamber", icon: Terminal },
    { id: "briefing", label: "Context", icon: Layers },
    { id: "progress", label: "Progress", icon: Activity },
    { id: "reports", label: "Notes", icon: BookOpen },
  ];

  const currentNav = isChamberMode ? chamberNavItems : standardNavItems;

  const handleNavClick = (tabId: SidebarTab) => {
    if (onTabChange) {
      onTabChange(tabId);
    }
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header Bar */}
      <div className="lg:hidden w-full bg-[#0E0F0E]/95 backdrop-blur-md border-b border-[#21221F] px-4 py-3 flex items-center justify-between sticky top-0 z-40 select-none">
        <BrandLogo href="/" size="sm" />
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg border border-[#2A2B28] text-[#C5C6BC] hover:text-[#F3EFE0] bg-[#171817] active:scale-95 transition-all cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
          aria-label="Open Navigation Menu"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer / Main Desktop Sidebar */}
      <aside
        className={`w-60 flex-shrink-0 bg-[#0E0F0E] border-r border-[#1F201E] min-h-screen flex flex-col justify-between p-4 z-50 select-none transition-transform duration-200 ease-out ${
          mobileOpen
            ? "fixed inset-y-0 left-0 shadow-2xl translate-x-0 block w-64 max-w-[85vw]"
            : "hidden lg:flex"
        } ${className}`}
      >
        <div className="space-y-6">
          {/* Top Logo & Mobile Close Button */}
          <div className="px-2 pt-2 pb-1 flex items-center justify-between">
            <BrandLogo href="/" size="md" />
            {mobileOpen && (
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden p-1.5 rounded-lg border border-[#2D2E2B] text-[#8E8F86] hover:text-[#F3EFE0] bg-[#181918] cursor-pointer"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Navigation items */}
          <nav className="space-y-1.5" aria-label="Application Navigation">
            {currentNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id || (item.id === "candidates" && (activeTab === "briefing" || activeTab === "candidates"));

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-sans text-xs transition-all text-left cursor-pointer min-h-[44px] ${
                    isActive
                      ? "bg-[#181918] text-[#F3EFE0] border border-[#D7CE83]/40 shadow-xs font-semibold"
                      : "text-[#8C8D84] hover:text-[#C5C6BC] hover:bg-[#141514] border border-transparent"
                  }`}
                >
                  <Icon
                    size={15}
                    className={isActive ? "text-[#D7CE83]" : "text-[#7B7C73]"}
                  />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Panel: User profile */}
        <div className="pt-4 border-t border-[#1F201E]">
          {/* Current User Profile (Nikhil Chen / Admin) */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#141514] border border-[#232422]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[#20211F] border border-[#323330] overflow-hidden flex items-center justify-center text-xs font-bold text-[#F3EFE0] flex-shrink-0">
                N
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-xs font-medium text-[#F3EFE0] truncate">
                  Nikhil Chen
                </span>
                <span className="font-mono text-[9px] text-[#7B7C73] truncate">
                  Admin
                </span>
              </div>
            </div>
            <ChevronDown size={13} className="text-[#7B7C73] flex-shrink-0" />
          </div>
        </div>
      </aside>
    </>
  );
}

