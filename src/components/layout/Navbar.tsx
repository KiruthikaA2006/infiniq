"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = "" }: NavbarProps) {
  return (
    <header className={`w-full z-30 select-none border-b border-infiniq-border/60 bg-infiniq-bg/85 backdrop-blur-md sticky top-0 ${className}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Wordmark */}
        <Link href="/" className="flex items-center gap-2.5 infiniq-focus rounded py-1 px-1.5 -ml-1.5 transition-opacity hover:opacity-90">
          <div className="w-7 h-7 rounded bg-infiniq-surface-2 border border-infiniq-accent/30 flex items-center justify-center text-infiniq-accent shadow-xs">
            <span className="font-mono text-xs font-bold tracking-tighter">IQ</span>
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-sm font-semibold tracking-tight text-infiniq-text-primary">
              Infini<span className="text-infiniq-accent font-bold">Q</span>
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-infiniq-text-muted -mt-0.5">
              AI Interviewer
            </span>
          </div>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Link href="/interview">
            <Button variant="primary" size="sm" className="h-8 text-xs font-semibold px-3.5">
              Start Interview
              <ArrowRight size={12} className="ml-1" />
            </Button>
          </Link>
        </div>

      </div>
    </header>
  );
}

