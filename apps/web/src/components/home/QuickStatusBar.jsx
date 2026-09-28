import React from "react";
import { Briefcase, Target, Radio } from "lucide-react";
import { defaultWorkspaceStats } from "../../data/mockData";

export default function QuickStatusBar({
  sessionStatus = defaultWorkspaceStats.sessionStatus,
  targetRole = defaultWorkspaceStats.targetRole,
  todayFocus = defaultWorkspaceStats.focusTopic,
}) {
  return (
    <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      {/* Single-row horizontal bar with translucent dark styling */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0D131F]/85 border border-white/10 backdrop-blur-xl shadow-[0_6px_25px_rgba(0,0,0,0.45)]">
        
        {/* Metric 1: Live Session Indicator */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </span>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-200 font-semibold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 hidden sm:inline-block" />
            {sessionStatus}
          </span>
        </div>

        {/* Divider (Desktop) */}
        <div className="hidden md:block w-px h-5 bg-white/10" />

        {/* Metric 2: Target Role Display with subtle cyan pill badge */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-mono text-[#94A3B8]">Target Role:</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#060A12] border border-cyan-500/30 text-xs font-mono text-cyan-300 font-medium shadow-[0_0_10px_rgba(6,182,212,0.15)]">
            <Briefcase className="w-3 h-3 text-cyan-400" />
            <span className="text-white font-semibold">{targetRole}</span>
          </span>
        </div>

        {/* Divider (Desktop) */}
        <div className="hidden md:block w-px h-5 bg-white/10" />

        {/* Metric 3: Today's Focus */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 flex-shrink-0">
            <Target className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono text-[#94A3B8]">
            Today&apos;s Focus:{" "}
            <span className="text-white font-semibold">{todayFocus}</span>
          </span>
        </div>

      </div>
    </section>
  );
}

