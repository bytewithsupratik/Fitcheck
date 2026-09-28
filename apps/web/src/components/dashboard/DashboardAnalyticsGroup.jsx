import React, { useState } from "react";
import {
  Radar,
  TrendingUp,
  Flame,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { INITIAL_ACTIVITY_DAYS } from "../../data/mockData";

const FALLBACK_SKILL = {
  key: "CAP-CORE",
  label: "CORE CAPABILITY",
  user: 25,
  industry: 80,
  note: "Calibrating",
};

const FALLBACK_TIMELINE_POINT = {
  week: "Today",
  date: "Current",
  score: 25,
  label: "Active Evaluation",
  delta: "+0",
};

export default function DashboardAnalyticsGroup({ metrics, skills = [], timeline = [], currentUser }) {
  const chartSkills = skills && skills.length > 0 ? skills : [FALLBACK_SKILL];
  const chartTimeline = timeline && timeline.length > 0 ? timeline : [FALLBACK_TIMELINE_POINT];

  // Radial chart state
  const [selectedRadialSkill, setSelectedRadialSkill] = useState(chartSkills[0]);
  const [showIndustryTarget, setShowIndustryTarget] = useState(true);

  // Growth graph state
  const [hoveredGrowthPoint, setHoveredGrowthPoint] = useState(null);

  // System-determined Consistency Streak
  const parsedStreak = Number.parseInt(metrics?.streak, 10);
  const currentStreakDays = metrics?.metrics?.streakDays ?? (Number.isFinite(parsedStreak) ? parsedStreak : 0);
  const isStreakActive = currentStreakDays > 0;
  const activeRadialSkill =
    chartSkills.find((skill) => skill?.key === selectedRadialSkill?.key) ||
    chartSkills[0] ||
    FALLBACK_SKILL;
  const latestTimelinePoint =
    chartTimeline[chartTimeline.length - 1] ||
    FALLBACK_TIMELINE_POINT;
  const growthPoints = chartTimeline.map((item, index) => {
    const actualPoints = chartTimeline.filter((point) => point.week !== "Target");
    const isTarget = item.week === "Target";
    const actualIndex = actualPoints.indexOf(item);
    return {
      x: chartTimeline.length <= 1 ? 165 : 20 + (index * 290) / (chartTimeline.length - 1),
      y: 170 - (Math.min(100, Math.max(0, item.score || 0)) * 1.4),
      item,
      isTarget,
      isCurrent: !isTarget && actualIndex === actualPoints.length - 1,
    };
  });
  const actualGrowthPoints = growthPoints.filter((point) => !point.isTarget);
  const targetGrowthPoint = growthPoints.find((point) => point.isTarget);
  const growthLine = actualGrowthPoints.map((point) => `${point.x},${point.y}`).join(" ");
  const growthArea = actualGrowthPoints.length
    ? `${growthLine} ${actualGrowthPoints[actualGrowthPoints.length - 1].x},170 ${actualGrowthPoints[0].x},170`
    : "";

  // Radial Chart Geometry Calculations (SVG polygon)
  const radarCenter = 150;
  const radarRadius = 100;
  const totalAxes = chartSkills.length;

  const getCoordinates = (index, value) => {
    const angle = (index * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const distance = (value / 100) * radarRadius;
    const x = radarCenter + distance * Math.cos(angle);
    const y = radarCenter + distance * Math.sin(angle);
    return { x, y };
  };

  // User polygon points
  const userPolygonPoints = chartSkills.map((item, idx) => {
    const { x, y } = getCoordinates(idx, item.user);
    return `${x},${y}`;
  }).join(" ");

  // Industry polygon points
  const industryPolygonPoints = chartSkills.map((item, idx) => {
    const { x, y } = getCoordinates(idx, item.industry);
    return `${x},${y}`;
  }).join(" ");

  // Concentric background grid rings (20, 40, 60, 80, 100)
  const gridLevels = [20, 40, 60, 80, 100];

  return (
    <section id="grouped-analytics-section" className="w-full">
      {/* Grouped Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Unified Visual Analytics</span>
            </span>
            <span className="text-xs font-mono text-slate-400">
              3 Grouped Metrics
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <span>Skill, Growth & Consistency Analytics</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl leading-relaxed">
            Cohesive telemetry mapping your verified skills to industry demand, historical readiness score progression since joining, and daily goal completion streak.
          </p>
        </div>

        {/* Quick Streak Snapshot Pill */}
        <div className="flex items-center gap-2.5 bg-[#0D131F] border border-white/10 rounded-xl px-3.5 py-2">
          <Flame className={`w-5 h-5 ${isStreakActive ? "text-amber-400 fill-amber-400 animate-pulse" : "text-slate-500"}`} />
          <div className="text-left font-mono">
            <span className="text-[10px] text-slate-400 block uppercase">Consistency Status</span>
            <span className={`text-xs font-bold ${isStreakActive ? "text-cyan-300" : "text-amber-400"}`}>
              {isStreakActive ? `${currentStreakDays}d Streak (Active)` : "Idle Today"}
            </span>
          </div>
        </div>
      </div>

      {/* Grouped Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ============================================================ */}
        {/* GRAPH 1: RADIAL ALIGNMENT GRAPH (SKILLS VS INDUSTRY DEMANDS) */}
        {/* ============================================================ */}
        <div className="bg-[#0D131F] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -left-16 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Radar className="w-3.5 h-3.5" />
                <span>Radial Alignment Graph</span>
              </span>
              <button
                type="button"
                onClick={() => setShowIndustryTarget(!showIndustryTarget)}
                className="text-[11px] font-mono text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                {showIndustryTarget ? "Hide Industry Bar" : "Show Industry Bar"}
              </button>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Skill Mapping vs Industry Demands
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Radial radar comparing your verified code evidence against Tier-1 senior technical benchmarks.
            </p>

            {/* Radial Radar SVG Chart */}
            <div className="relative flex items-center justify-center my-4 py-2">
              <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible select-none">
                <defs>
                  <radialGradient id="radarUserGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#0891B2" stopOpacity="0.15" />
                  </radialGradient>
                  <filter id="cyanPointGlow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
                    <feMerge>
                      <feMergeNode />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Concentric Reference Rings */}
                {gridLevels.map((lvl) => {
                  const r = (lvl / 100) * radarRadius;
                  return (
                    <circle
                      key={lvl}
                      cx={radarCenter}
                      cy={radarCenter}
                      r={r}
                      fill="transparent"
                      stroke="#1E293B"
                      strokeWidth="1"
                      strokeDasharray={lvl === 100 ? "0" : "2,2"}
                    />
                  );
                })}

                {/* Axis Radial Lines */}
                {chartSkills.map((_, idx) => {
                  const angle = (idx * 2 * Math.PI) / totalAxes - Math.PI / 2;
                  const x = radarCenter + radarRadius * Math.cos(angle);
                  const y = radarCenter + radarRadius * Math.sin(angle);
                  return (
                    <line
                      key={idx}
                      x1={radarCenter}
                      y1={radarCenter}
                      x2={x}
                      y2={y}
                      stroke="#1E293B"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Industry Target Benchmark Polygon */}
                {showIndustryTarget && (
                  <polygon
                    points={industryPolygonPoints}
                    fill="#6366F1"
                    fillOpacity="0.08"
                    stroke="#818CF8"
                    strokeWidth="1.5"
                    strokeDasharray="3,3"
                  />
                )}

                {/* User Verified Competence Polygon */}
                <polygon
                  points={userPolygonPoints}
                  fill="url(#radarUserGradient)"
                  stroke="#22D3EE"
                  strokeWidth="2.2"
                />

                {/* Vertex Interactive Click/Hover Dots */}
                {chartSkills.map((skill, idx) => {
                  const userCoord = getCoordinates(idx, skill.user);
                  const isSelected = activeRadialSkill?.key === skill.key;

                  return (
                    <g key={skill.key} className="cursor-pointer" onClick={() => setSelectedRadialSkill(skill)}>
                      <circle
                        cx={userCoord.x}
                        cy={userCoord.y}
                        r={isSelected ? 6 : 4}
                        fill="#22D3EE"
                        stroke="#060A12"
                        strokeWidth="2"
                        filter="url(#cyanPointGlow)"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Selected Skill Drilldown Card */}
            <div className="bg-[#060A12] border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-white font-bold">{activeRadialSkill?.label || currentUser?.targetRole || "No skill data"}</span>
                <span className={`font-semibold ${activeRadialSkill?.user >= activeRadialSkill?.industry ? "text-emerald-400" : "text-amber-400"}`}>
                  {activeRadialSkill?.note || "Awaiting assessment"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mt-2 pt-2 border-t border-white/5">
                <span>Verified: <strong className="text-cyan-300">{activeRadialSkill?.user ?? 0}%</strong></span>
                <span>Industry Bar: <strong className="text-indigo-300">{activeRadialSkill?.industry ?? 80}%</strong></span>
              </div>
            </div>
          </div>

          {/* Chart Legend */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Your Verified Level</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-indigo-400 border-b border-dashed" />
              <span>Industry Bar</span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GRAPH 2: GROWTH GRAPH (SINCE JOINING THE WEBSITE)            */}
        {/* ============================================================ */}
        <div className="bg-[#0D131F] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Growth Graph</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                +137.5% Growth
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Readiness Growth Since Joining
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Tracks how much you have grown from initial onboarding (24 pts) to your current score (57 pts).
            </p>

            {/* Growth Curve SVG Area Chart */}
            <div className="relative my-4 py-2">
              <svg width="100%" height="190" viewBox="0 0 320 180" className="overflow-visible select-none">
                <defs>
                  <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference lines */}
                <line x1="0" y1="30" x2="320" y2="30" stroke="#1E293B" strokeDasharray="3,3" />
                <line x1="0" y1="80" x2="320" y2="80" stroke="#1E293B" strokeDasharray="3,3" />
                <line x1="0" y1="130" x2="320" y2="130" stroke="#1E293B" strokeDasharray="3,3" />

                {/* Area polygon */}
                {growthArea && <polygon points={growthArea} fill="url(#growthAreaGradient)" />}

                {/* Achieved Growth Solid Line */}
                {actualGrowthPoints.length > 1 && (
                  <polyline
                    points={growthLine}
                    fill="none"
                    stroke="#22D3EE"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}

                {/* Projected Target Dotted Line to 85 pts */}
                {targetGrowthPoint && actualGrowthPoints.length > 0 && (
                  <polyline
                    points={`${actualGrowthPoints[actualGrowthPoints.length - 1].x},${actualGrowthPoints[actualGrowthPoints.length - 1].y} ${targetGrowthPoint.x},${targetGrowthPoint.y}`}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                )}

                {/* Data Points */}
                {growthPoints.map((pt, idx) => (
                  <g
                    key={idx}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredGrowthPoint(pt.item)}
                    onMouseLeave={() => setHoveredGrowthPoint(null)}
                  >
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.isCurrent ? 6 : 4.5}
                      fill={pt.isCurrent ? "#22D3EE" : pt.isTarget ? "#94A3B8" : "#0D131F"}
                      stroke={pt.isCurrent ? "#FFFFFF" : pt.isTarget ? "#64748B" : "#22D3EE"}
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={165}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {pt.item.week}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Hovered or Current Growth Milestone Details */}
            <div className="bg-[#060A12] border border-white/10 rounded-xl p-3.5">
              <div className="flex items-center justify-between text-xs font-mono mb-1">
                <span className="text-slate-400">
                  {hoveredGrowthPoint ? hoveredGrowthPoint.week : latestTimelinePoint?.week || "Current Milestone"}
                </span>
                <span className="text-cyan-400 font-bold">
                  {hoveredGrowthPoint ? `${hoveredGrowthPoint.score} pts` : `${latestTimelinePoint?.score ?? 0} / 100 pts`}
                </span>
              </div>
              <p className="text-xs text-white font-medium truncate">
                {hoveredGrowthPoint ? hoveredGrowthPoint.label : latestTimelinePoint?.label || "No readiness history available"}
              </p>
              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>JOIN DATE: AUG 21</span>
                <span className="text-emerald-400">+33 PTS NET GAIN</span>
              </div>
            </div>
          </div>

          {/* Bottom Trajectory Note */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Velocity: ~8.2 pts/week</span>
            <span className="text-cyan-300 font-semibold">28 pts to Senior Bar</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GRAPH 3: CONSISTENCY STREAK (SYSTEM TELEMETRY ENGINE)        */}
        {/* ============================================================ */}
        <div className="bg-[#0D131F] border border-white/10 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-1/2 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-amber-400" />
                <span>Consistency Streak Engine</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono">
                <ShieldCheck className="w-3 h-3" />
                <span>Telemetry Verified</span>
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              System-Calculated Presence & Streak
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Calculated automatically by platform telemetry based on your completed daily exercises, code audits, and curriculum syncs.
            </p>

            {/* Streak Status Hero Pill */}
            <div className="my-4 p-4 rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 to-emerald-950/20 flex items-center justify-between gap-3 transition-all">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-cyan-500/10 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                  <Flame className="w-6 h-6 fill-cyan-400 text-cyan-400" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider block text-cyan-400">
                    STREAK ACTIVE
                  </span>
                  <span className="text-xl font-extrabold text-white font-mono leading-tight">
                    {currentStreakDays} Days
                  </span>
                </div>
              </div>

              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                100% Platform Presence
              </span>
            </div>

            {/* 28-Day Consistency Calendar Grid */}
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
                <span>28-DAY ACTIVITY HEATMAP</span>
                <span>92.8% VERIFIED RATE</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 p-2 bg-[#060A12] rounded-xl border border-white/5">
                {INITIAL_ACTIVITY_DAYS.map((day) => {
                  const isActive = day.isToday ? isStreakActive : day.completed;
                  return (
                    <div
                      key={day.day}
                      title={day.isToday ? "Today: System Verified Active" : day.label}
                      className={`h-4 rounded-sm transition-all ${
                        day.isToday
                          ? "bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"
                          : isActive
                          ? "bg-cyan-500/70 hover:bg-cyan-400"
                          : "bg-[#1E293B] hover:bg-slate-700"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer Stats */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Longest Streak: 21 Days</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Streak Secured & Verified</span>
            </span>
          </div>
        </div>

      </div>
    </section>
  );
}
