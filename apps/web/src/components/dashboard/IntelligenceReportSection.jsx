import React, { useState } from "react";
import {
  Brain,
  TrendingUp,
  AlertCircle,
  Sparkles,
  Target,
  Zap,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ============================================================================
// [BACKEND INTEGRATION POINT] - INTELLIGENCE AUDIT & HIRING READINESS REPORT
// Endpoint: GET /api/v1/dashboard/intelligence
// Headers: { "X-Api-Key": API_KEY, "Authorization": "Bearer <JWT>" }
// Database Tables: `intelligence_audits`, `talent_signals`, `market_benchmarks`
// Description: AI-synthesized talent readiness briefing and industry bar comparison.
// ============================================================================
export default function IntelligenceReportSection({
  report,
  readinessScore = "25%",
  currentUser,
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedSignalId, setExpandedSignalId] = useState("sig-1");

  const safeData = report || {
    targetRole: currentUser?.targetRole || "Software Developer",
    overallAlignment: 28,
    marketDemandTier: "High Demand",
    summaryAssessment: "Synthesizing verified capability telemetry and priority gaps...",
    signals: [],
    tacticalAdvice: [],
  };
  const signals = safeData.signals || [];
  const tacticalAdvice = safeData.tacticalAdvice || [];
  const summaryAssessment = safeData.summaryAssessment || "Your profile is calibrated against production benchmarks.";
  const parsedReadinessScore = Number.parseFloat(readinessScore);
  const overallAlignment = safeData.overallAlignment || (Number.isFinite(parsedReadinessScore) ? parsedReadinessScore : 28);
  const marketDemandTier = safeData.marketDemandTier || "High Demand";

  const filteredSignals = signals.filter((signal) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "trends") return signal.category === "Market Trends";
    if (activeFilter === "gaps") return ["Skill Gaps", "Priority Gap"].includes(signal.category);
    if (activeFilter === "strengths") return ["Verified Strengths", "Verified Strength"].includes(signal.category);
    return true;
  });

  const toggleExpand = (id) => {
    setExpandedSignalId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="intelligence-report-section" className="w-full">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI Intelligence Engine</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              {marketDemandTier}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Talent Intelligence Report</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Synthesized insights comparing your verified code evidence against real-world tech hiring rubrics, demand velocities, and senior technical bars.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-[#0D131F] border border-white/10 p-1 rounded-xl text-xs font-mono self-start md:self-auto overflow-x-auto">
          {[
            { id: "all", label: "All Signals" },
            { id: "trends", label: "Market Trends" },
            { id: "gaps", label: "Gaps" },
            { id: "strengths", label: "Strengths" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeFilter === tab.id
                  ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Signals & Market Synthesis */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Market Position Spotlight Card */}
          <div className="bg-[#0D131F] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                  TARGET ROLE FOCUS
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  {safeData.targetRole}
                </h3>
              </div>
              <div className="flex items-center gap-3 bg-[#060A12] border border-white/10 rounded-xl px-4 py-2 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">ROLE MATCH</span>
                  <span className="text-2xl font-extrabold font-mono text-cyan-400 leading-none">
                    {overallAlignment}%
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                  <Target className="w-5 h-5" />
                </div>
              </div>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm mt-4 leading-relaxed">
              {summaryAssessment}
            </p>
          </div>

          {/* Interactive Intelligence Signals List */}
          <div className="space-y-3">
            {filteredSignals.map((signal) => {
              const isExpanded = expandedSignalId === signal.id;
              return (
                <div
                  key={signal.id}
                  className="bg-[#0D131F]/90 border border-white/10 hover:border-cyan-500/30 rounded-xl transition-all duration-200 overflow-hidden text-left"
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(signal.id)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-start sm:items-center gap-3">
                      <div className={`p-2 rounded-lg flex-shrink-0 mt-0.5 sm:mt-0 ${
                        signal.type === "positive"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : signal.type === "warning"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30"
                      }`}>
                        {signal.type === "positive" && <TrendingUp className="w-4 h-4" />}
                        {signal.type === "warning" && <AlertCircle className="w-4 h-4" />}
                        {signal.type === "neutral" && <Layers className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono uppercase text-slate-400">
                            {signal.category}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#060A12] text-cyan-300 border border-white/10">
                            {signal.delta}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                          {signal.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400 hidden sm:inline font-mono">
                        {signal.urgency}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-white/5 space-y-3 bg-[#0A0E18]">
                      <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                        {signal.description}
                      </p>
                      <div className="bg-[#060A12] border border-cyan-500/20 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-cyan-300">
                          <Zap className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                          <span>{signal.action}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 uppercase whitespace-nowrap">
                          {signal.urgency}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Right 1 Col: Tactical AI Action Playbook */}
        <div className="bg-[#0D131F] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white tracking-tight">
                Tactical Sprint Recommendations
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Recommended highest-ROI actions to elevate your Unified Readiness Score from 57 to the 85-point Senior Bar.
            </p>

            <div className="space-y-4">
              {tacticalAdvice.map((item) => (
                <div
                  key={item.step}
                  className="bg-[#060A12] border border-white/10 hover:border-cyan-500/40 rounded-xl p-3.5 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-mono font-extrabold text-cyan-400">
                      STEP {item.step}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      {item.impact}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    {item.title}
                  </h4>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    {item.details}
                  </p>
                  <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>TIMELINE</span>
                    <span className="text-cyan-300 font-semibold">{item.timeline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <span className="text-[11px] font-mono text-slate-400 block mb-2">
              Next calibration in 18 hours
            </span>
            <div className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold py-2 px-3 rounded-xl">
              Syncing with Tech Market Feeds
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

