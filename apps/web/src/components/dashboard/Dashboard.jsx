import React, { useState, useEffect } from "react";
import { Target, TrendingUp, Sparkles } from "lucide-react";
import EvidenceEvaluationSection from "./EvidenceEvaluationSection.jsx";
import IntelligenceReportSection from "./IntelligenceReportSection.jsx";
import DashboardAnalyticsGroup from "./DashboardAnalyticsGroup.jsx";
import { mockReadinessScore } from "../../data/mockData";
import { dashboardService } from "../../services/dashboardService";
import { apiFetch } from "../../services/apiConfig";

export default function Dashboard({
  currentUser,
  onNavigate = () => {},
}) {
  const [metrics, setMetrics] = useState(null);
  const [evidenceRecords, setEvidenceRecords] = useState([]);
  const [intelligenceReport, setIntelligenceReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        const [metricsRes, evidenceRes, readinessRes] = await Promise.allSettled([
          dashboardService.fetchDashboardMetrics(),
          dashboardService.fetchEvidenceRecords(),
          apiFetch("/readiness/current"),
        ]);

        if (metricsRes.status === "fulfilled") {
          setMetrics(metricsRes.value);
        }

        if (evidenceRes.status === "fulfilled") {
          setEvidenceRecords(evidenceRes.value.evidence || []);
        }

        if (readinessRes.status === "fulfilled") {
          setIntelligenceReport(readinessRes.value.data || readinessRes.value);
        }
      } catch (err) {
        console.error("[Dashboard] Error loading live dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const readinessScore = Number(
    metrics?.metrics?.readinessPct ?? Number.parseInt(metrics?.readiness, 10)
  );
  const currentScore = Number.isFinite(readinessScore)
    ? readinessScore
    : mockReadinessScore.currentScore;
  const targetScore = metrics?.metrics?.goalPct ?? mockReadinessScore.maxScore;
  const readinessData = {
    ...mockReadinessScore,
    currentScore,
    targetBenchmark: `${targetScore} / 100 (${metrics?.metrics?.target || "Target"})`,
    activeGapPts: Math.max(0, targetScore - currentScore),
  };

  const rawCapabilities = intelligenceReport?.capabilities || [];
  const liveSkills = rawCapabilities.length > 0
    ? rawCapabilities.map((cap) => {
        const userScore = Math.round((cap.readiness || 0) * 100);
        return {
          key: cap.capability_id,
          label: cap.capability_id.replace("CAP-", ""),
          user: userScore,
          industry: 80,
          note: cap.state === "READY"
            ? "✓ Verified Ready"
            : `${cap.state.replace("_", " ")} (${userScore}%)`,
        };
      })
    : [
        { key: "CAP-TESTING", label: "TESTING", user: 85, industry: 80, note: "✓ Verified Ready" },
        { key: "CAP-JAVASCRIPT", label: "JAVASCRIPT", user: 75, industry: 80, note: "Developing" },
        { key: "CAP-TYPESCRIPT", label: "TYPESCRIPT", user: 20, industry: 80, note: "Foundational" },
        { key: "CAP-REACT", label: "REACT", user: 0, industry: 80, note: "Priority Gap" },
        { key: "CAP-NEXTJS", label: "NEXTJS", user: 0, industry: 80, note: "Priority Gap" },
      ];

  const currentReadinessScore = Math.round(
    (intelligenceReport?.readiness?.overall || 0.25) * 100
  );
  const liveTimeline = [
    {
      week: "Baseline",
      date: "Onboarding",
      score: 25,
      label: "Initial Goal Calibrated",
      delta: "+25",
    },
    {
      week: "Today",
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      score: currentReadinessScore,
      label: "Verified Capability Evaluation",
      delta: `+${Math.max(0, currentReadinessScore - 25)}`,
    },
    {
      week: "Target",
      date: "Goal",
      score: 85,
      label: "Job-Ready Benchmark",
      delta: "+60",
    },
  ];

  const liveIntelligenceReport = intelligenceReport ? {
    targetRole: currentUser?.targetRole || "Full Stack Developer",
    overallAlignment: Math.round((intelligenceReport.readiness?.overall || 0.28) * 100),
    marketDemandTier: "Very High Demand (Top 5% Hiring Urgency)",
    summaryAssessment: intelligenceReport.explanation?.summary ||
      `Your current readiness is ${Math.round((intelligenceReport.readiness?.overall || 0.28) * 100)}%. Key capability gaps are identified for your target.`,
    signals: [
      ...(intelligenceReport.priority_gaps || []).slice(0, 3).map((gap, index) => ({
        id: `sig-gap-${index}`,
        category: "Priority Gap",
        title: `${gap.capability_id.replace("CAP-", "")} (${gap.importance || "CORE"})`,
        delta: `Priority ${gap.priority}`,
        urgency: gap.importance === "CORE" ? "High Impact" : "Medium Priority",
        type: "warning",
        description: `Target requires ${gap.required_proficiency}, but current state is ${gap.attained_proficiency || "NOT DEMONSTRATED"}.`,
        action: "Recommended focus in upcoming daily sprint.",
      })),
      ...(intelligenceReport.capabilities || [])
        .filter((capability) => capability.state === "READY")
        .map((capability, index) => ({
          id: `sig-ready-${index}`,
          category: "Verified Strength",
          title: `${capability.capability_id.replace("CAP-", "")} Verified`,
          delta: `${Math.round((capability.readiness || 0.85) * 100)}%`,
          urgency: "Market Differentiator",
          type: "positive",
          description: "Capability verified through public repository evidence analysis.",
          action: "Showcased in your verified evidence portfolio.",
        })),
    ],
    tacticalAdvice: (intelligenceReport.explanation?.priority_gap_explanations || []).slice(0, 3).map((explanation, index) => ({
      step: `0${index + 1}`,
      title: `Close gap in ${explanation.capability_id.replace("CAP-", "")}`,
      timeline: "Current Sprint",
      impact: "+15% Readiness",
      details: explanation.explanation,
    })),
  } : null;

  // Circular gauge calculations for the readiness score
  const gaugeRadius = 90;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const gaugeProgress = Math.min(
    Math.max(readinessData.currentScore / readinessData.maxScore, 0),
    1
  );
  const gaugeDashoffset = gaugeCircumference * (1 - gaugeProgress);

  const scrollToSection = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div aria-busy={loading} className="min-h-[calc(100vh-4rem)] bg-[#060A12] text-[#F8FAFC] pt-6 sm:pt-8 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto space-y-12">

        {/* ============================================================ */}
        {/* DASHBOARD HERO HEADER & QUICK JUMP ANCHORS                  */}
        {/* ============================================================ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Telemetry</span>
              </span>
              <span className="text-xs font-mono text-slate-400">
                FitCheck Talent Operating System
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Technical Readiness Dashboard
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Real-time skill verification, gym-evidenced projects, AI market intelligence, and continuous streak analytics.
            </p>
          </div>

          {/* Quick Nav Anchors */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            <button
              type="button"
              onClick={() => scrollToSection("readiness-score-section")}
              className="bg-[#0D131F] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Readiness Score
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("evidence-evaluation-section")}
              className="bg-[#0D131F] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Evidence Report
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("intelligence-report-section")}
              className="bg-[#0D131F] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Intelligence Report
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("grouped-analytics-section")}
              className="bg-[#0D131F] hover:bg-white/5 border border-white/10 text-slate-300 hover:text-cyan-300 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
            >
              Analytics & Streak
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION 1: READINESS SCORE CALCULATOR                        */}
        {/* ============================================================ */}
        <section id="readiness-score-section" className="w-full">
          <div className="bg-[#0D131F]/90 border border-white/10 hover:border-cyan-500/30 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all">
            {/* Ambient Subtle Radial Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* A. Section Header Row */}
            <div className="relative z-10">
              <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase mb-1 block">
                UNIFIED COMPETENCE METRIC
              </span>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
                  <Target className="w-7 h-7 text-cyan-400 stroke-[2.2] flex-shrink-0" />
                  <span>Readiness Score Calculator</span>
                </h2>

                <div className="bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>+{readinessData.dailyChange} today</span>
                </div>
              </div>

              <p className="text-slate-400 text-sm mt-2 mb-6 max-w-3xl leading-relaxed">
                Calculated dynamically from verified daily forecasts, passed dynamic quizzes, and code challenges completed in the Technical Gym.
              </p>
            </div>

            {/* B. Centered Circular Progress Gauge */}
            <div className="relative z-10 flex flex-col items-center justify-center my-4">
              <div className="relative flex items-center justify-center w-[220px] h-[220px]">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 220 220"
                >
                  <defs>
                    <filter
                      id="cyanGlowGauge"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur stdDeviation="3.5" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Background Track Arc */}
                  <circle
                    cx="110"
                    cy="110"
                    r={gaugeRadius}
                    stroke="#1E293B"
                    strokeWidth="14"
                    fill="transparent"
                  />

                  {/* Foreground Animated Glowing Progress Ring */}
                  <circle
                    cx="110"
                    cy="110"
                    r={gaugeRadius}
                    stroke="#22D3EE"
                    strokeWidth="14"
                    strokeDasharray={gaugeCircumference}
                    strokeDashoffset={gaugeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    filter="url(#cyanGlowGauge)"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>

                {/* Center Display Inside Circle */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
                  <span className="text-5xl font-extrabold text-white font-mono tracking-tight leading-none">
                    {readinessData.currentScore}
                  </span>
                  <span className="text-slate-400 text-xs font-mono mt-1.5 block">
                    / {readinessData.maxScore} Maximum
                  </span>
                  <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest mt-3 inline-block shadow-[0_0_12px_rgba(34,211,238,0.2)]">
                    {readinessData.rankBadge}
                  </span>
                </div>
              </div>
            </div>

            {/* C. Bottom Metrics Cards Row */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
              {/* Card 1: Target Benchmark */}
              <div className="bg-[#060A12]/80 border border-white/10 rounded-xl p-4">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  TARGET BENCHMARK
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {readinessData.targetBenchmark}
                </span>
              </div>

              {/* Card 2: Active Gap */}
              <div className="bg-[#060A12]/80 border border-white/10 rounded-xl p-4">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  ACTIVE GAP
                </span>
                <span className="text-lg font-bold text-cyan-400 font-mono">
                  {readinessData.activeGapPts} pts to target
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ */}
        {/* SECTION 2: EVIDENCE EVALUATION REPORT (GYM PROJECTS & AUDIT) */}
        {/* ============================================================ */}
        <EvidenceEvaluationSection
          evidence={evidenceRecords}
          onNavigate={onNavigate}
        />

        {/* ============================================================ */}
        {/* SECTION 3: INTELLIGENCE REPORT (TALENT & MARKET SIGNALS)     */}
        {/* ============================================================ */}
        <IntelligenceReportSection
          report={liveIntelligenceReport}
          readinessScore={metrics?.readiness || "25%"}
          currentUser={currentUser}
        />

        {/* ============================================================ */}
        {/* SECTION 4: GROUPED PERFORMANCE & SKILL ANALYTICS GRAPHS      */}
        {/* (Radial Alignment Graph, Growth Graph, Consistency Streak)   */}
        {/* ============================================================ */}
        <DashboardAnalyticsGroup
          metrics={metrics}
          skills={liveSkills}
          timeline={liveTimeline}
          currentUser={currentUser}
        />

      </div>
    </div>
  );
}

