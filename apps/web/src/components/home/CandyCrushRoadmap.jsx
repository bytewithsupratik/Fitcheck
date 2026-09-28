import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Play,
  Lock,
  Trophy,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Target,
  ChevronRight,
  Layers,
  Flag,
  Compass,
  ArrowDown,
  ArrowUp,
  Flame,
  Award,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { roadmapService } from "../../services/roadmapService";

// ============================================================================
// FALLBACK DATA CONFIGURATIONS (Ensures zero missing import errors)
// ============================================================================
const DEFAULT_MONTH_CONFIG = [
  { month: 1, title: "Foundations & Compilers", category: "Core Architecture", startDay: 1, endDay: 30 },
  { month: 2, title: "Concurrency & Distributed Sharding", category: "Systems Engineering", startDay: 31, endDay: 60 },
  { month: 3, title: "GPU Operators & High Throughput", category: "AI Infrastructure", startDay: 61, endDay: 90 },
  { month: 4, title: "Advanced Latency Optimization", category: "Performance Engineering", startDay: 91, endDay: 120 },
  { month: 5, title: "Chaos Engineering & Resilience", category: "Production Hardening", startDay: 121, endDay: 150 },
  { month: 6, title: "Apex Production Mastery", category: "Principal Scale", startDay: 151, endDay: 180 },
];

// ============================================================================
// [BACKEND INTEGRATION POINT] - 6-MONTH ROADMAP PROGRESSION & CURRICULUM
// Endpoint: GET /api/v1/roadmap/curriculum?trackId=ai_ml&totalDays=180
// Headers: {
//   "X-Api-Key": process.env.VITE_FITCHECK_API_KEY || "FITCHECK_SEC_KEY_PROD",
//   "Authorization": "Bearer <JWT_AUTH_TOKEN>"
// }
// ============================================================================
export default function CandyCrushRoadmap({
  monthConfig = DEFAULT_MONTH_CONFIG,
  targetRole = "AI/ML Specialist",
}) {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [hoveredDay, setHoveredDay] = useState(null);
  const [activeMonthFilter, setActiveMonthFilter] = useState("all"); // 'all' or month number 1-6
  const containerRef = useRef(null);

  const fetchRoadmap = async () => {
    const token = localStorage.getItem("fitcheck_auth_token");

    if (!token) {
      console.log("[Roadmap] No auth token found. Skipping roadmap fetch.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await roadmapService.getTrack();
      setDays(data.days || []);
    } catch (err) {
      console.error("[Roadmap] Failed to fetch track:", err);
      setError(err.message || "Failed to load curriculum roadmap");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, []);

  useEffect(() => {
    if (loading || days.length === 0) return;
    const currentDay = days.find((day) => day.status === "current");
    const timer = setTimeout(() => {
      const activeEl = document.getElementById(`day-node-${currentDay?.dayNumber || 1}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [loading, days]);

  const handleCompleteTask = async (taskId) => {
    if (!taskId || completing) return;

    try {
      setCompleting(true);
      const result = await roadmapService.completeTask(taskId);
      console.log("[Roadmap] Completion response:", result);
      await fetchRoadmap();
      setActiveTask(null);
    } catch (err) {
      console.error("[Roadmap] Failed to complete task:", err);
      alert(err.message || "Failed to complete task.");
    } finally {
      setCompleting(false);
    }
  };

  const handleNodeClick = (day) => {
    if (day.status === "locked") return;
    setActiveTask(day);
  };

  const scrollToDay = (num) => {
    const el = document.getElementById(`day-node-${num}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const totalDays = days.length || 2;
  const completedCount = days.filter((d) => d.status === "completed").length;
  const visibleMonthConfig = monthConfig
    .filter((config) => config.startDay <= totalDays)
    .map((config) => ({ ...config, endDay: Math.min(config.endDay, totalDays) }));
  const timelineMonths = visibleMonthConfig.length || Math.ceil(totalDays / 30);
  const activeDay = days.find((d) => d.status === "current")?.dayNumber || (completedCount + 1);
  const activeMonth = Math.min(Math.ceil(activeDay / 30), timelineMonths);

  // Filter days based on the configured timeline.
  const displayedDays = useMemo(() => {
    if (activeMonthFilter === "all") return days;
    const mNum = parseInt(activeMonthFilter, 10);
    const mConfig = visibleMonthConfig.find((m) => m.month === mNum);
    if (!mConfig) return days;
    return days.filter(
      (d) => d.dayNumber >= mConfig.startDay && d.dayNumber <= mConfig.endDay
    );
  }, [days, activeMonthFilter, visibleMonthConfig]);

  // Serpentine S-Curve coordinates
  const spacingY = 120;
  const startY = 100;

  const nodePositions = useMemo(() => {
    return displayedDays.map((_, i) => {
      const cycle = i % 4;
      let offsetX = 0;
      if (cycle === 1) offsetX = -110;
      if (cycle === 3) offsetX = 110;
      return {
        x: 250 + offsetX,
        y: startY + i * spacingY,
      };
    });
  }, [displayedDays]);

  const totalSvgHeight = useMemo(() => {
    return Math.max(800, (displayedDays.length - 1) * spacingY + 220);
  }, [displayedDays, spacingY]);

  // Overall statistics
  const remainingDays = Math.max(0, totalDays - completedCount);
  const progressPercent = totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-cyan-400">
        <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-sm font-medium tracking-wide">Loading your live curriculum...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-8 rounded-xl border border-red-800/50 bg-red-950/20 p-6 text-center text-red-400">
        <p className="mb-2 font-semibold">Could not load roadmap</p>
        <p className="mb-4 text-sm text-red-300">{error}</p>
        <button
          type="button"
          onClick={fetchRoadmap}
          className="rounded-lg bg-red-900/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <section
      id="roadmap-tree"
      ref={containerRef}
      className="relative w-full max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6"
    >
      {/* ============================================================ */}
      {/* 1. COMPREHENSIVE 6-MONTH ROADMAP HEADER BANNER               */}
      {/* ============================================================ */}
      <div className="relative mb-8 rounded-3xl bg-[#0D131F]/90 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-[0_16px_50px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top telemetry badge strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#060A12] border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </span>
            <span>{Math.ceil(totalDays / 30)}-MONTH TRAJECTORY // {totalDays}-DAY DEADLINE</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Target className="w-3.5 h-3.5 text-cyan-400" />
            <span>CALIBRATED TO SENIOR PRODUCTION BAR</span>
          </div>
        </div>

        {/* Title & Narrative */}
        <div className="max-w-3xl mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight font-display">
            {totalDays}-Day {targetRole} Roadmap
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed font-sans">
            Every day is a discrete, production-calibrated challenge across your {Math.ceil(totalDays / 30)}-month learning timeline.
          </p>
        </div>

        {/* 4 Telemetry Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-[#060A12]/80 border border-white/10 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-cyan-400" />
              Total Timeline
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-white mt-1">
              {totalDays} Days
            </span>
            <span className="text-[10px] text-cyan-300/80 font-mono">{Math.ceil(totalDays / 30)} Months Full Scope</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#060A12]/80 border border-cyan-400/30 flex flex-col shadow-[0_0_15px_rgba(34,211,238,0.1)]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-cyan-400" />
              Active Level
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-cyan-300 mt-1">
              Day {activeDay} of {totalDays}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Month {Math.ceil(activeDay / 30)}: In Progress</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#060A12]/80 border border-white/10 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" />
              Verified Done
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-white mt-1">
              {completedCount} Levels ({progressPercent}%)
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Verified Stars</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#060A12]/80 border border-white/10 flex flex-col">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-400" />
              Remaining
            </span>
            <span className="text-base sm:text-lg font-bold font-mono text-white mt-1">
              {remainingDays} Days Left
            </span>
            <span className="text-[10px] text-amber-400/80 font-mono">Target: Apex Day {totalDays}</span>
          </div>
        </div>

        {/* 6-Month Segmented Visual Progress Bar */}
        <div className="space-y-2 mb-6 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">{Math.ceil(totalDays / 30)}-Month Curriculum Trajectory Progress</span>
            <span className="text-cyan-400 font-bold">{completedCount} / {totalDays} Days ({progressPercent}%)</span>
          </div>

          <div className="grid gap-1.5 h-2.5" style={{ gridTemplateColumns: `repeat(${timelineMonths}, minmax(0, 1fr))` }}>
            {visibleMonthConfig.map((cfg) => {
              const isPast = cfg.month < activeMonth;
              const isCurrentMonth = cfg.month === activeMonth;
              return (
                <div
                  key={cfg.month}
                  className={cn(
                    "h-full rounded-full transition-all relative overflow-hidden",
                    isPast
                      ? "bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_#22d3ee]"
                      : isCurrentMonth
                      ? "bg-slate-800"
                      : "bg-white/10"
                  )}
                  title={`Month ${cfg.month}: ${cfg.title}`}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
            {visibleMonthConfig.map((cfg) => (
              <span key={cfg.month} className={cfg.month === activeMonth ? "font-bold text-cyan-300" : ""}>
                M{cfg.month} ({cfg.startDay}–{cfg.endDay}){cfg.month === activeMonth ? " [Active]" : cfg.month < activeMonth ? " ✓" : ""}
              </span>
            ))}
          </div>
        </div>

        {/* Interactive Month Jump & Filter Tabs */}
        <div className="pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Jump To Month or Scope View:</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-400/80">
              {activeMonthFilter === "all"
                ? `Viewing All ${totalDays} Days Continuously`
                : `Focusing on Month ${activeMonthFilter}`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveMonthFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer",
                activeMonthFilter === "all"
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10"
              )}
            >
              All {totalDays} Days (Full Trajectory)
            </button>

            {visibleMonthConfig.map((cfg) => {
              const isCur = cfg.month === activeMonth;
              const isSelected = activeMonthFilter === String(cfg.month);
              return (
                <button
                  key={cfg.month}
                  type="button"
                  onClick={() => {
                    setActiveMonthFilter(String(cfg.month));
                    scrollToDay(cfg.startDay);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-xl font-mono text-xs transition-all cursor-pointer flex items-center gap-1.5",
                    isSelected
                      ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(34,211,238,0.3)]"
                      : isCur
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30"
                      : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/10"
                  )}
                >
                  <span>M{cfg.month} ({cfg.startDay}–{cfg.endDay})</span>
                  {isCur && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. Live roadmap task canvas */}
      {/* ============================================================ */}
      <div className="relative py-10 px-2 sm:px-4 flex flex-col items-center justify-center overflow-hidden rounded-3xl bg-[#060A12]/90 border border-white/10 shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(34, 211, 238, 0.25) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[110px] pointer-events-none" />

        {/* S-CURVE SVG CABLE TRACK ENGINE */}
        <div className="relative w-full max-w-[500px] mx-auto">
          <svg
            viewBox={`0 0 500 ${totalSvgHeight}`}
            className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0"
          >
            <defs>
              <linearGradient id="laserCompleted" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="laserActive" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
              </linearGradient>
              <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {nodePositions.map((pos, idx) => {
              if (idx >= nodePositions.length - 1) return null;
              const nextPos = nodePositions[idx + 1];
              const currentDay = displayedDays[idx];
              const nextDay = displayedDays[idx + 1];

              if (!currentDay || !nextDay || !pos || !nextPos) return null;

              const isPathCompleted =
                currentDay?.status === "completed" &&
                nextDay?.status === "completed";
              const isPathActive =
                (currentDay?.status === "completed" &&
                  nextDay?.status === "current") ||
                (currentDay?.status === "current" &&
                  nextDay?.status === "locked");

              const midY = (pos.y + nextPos.y) / 2;
              const pathD = `M ${pos.x} ${pos.y} C ${pos.x} ${midY}, ${nextPos.x} ${midY}, ${nextPos.x} ${nextPos.y}`;

              return (
                <g key={`cable-${currentDay?.id || idx}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isPathCompleted
                        ? "url(#laserCompleted)"
                        : isPathActive
                        ? "url(#laserActive)"
                        : "rgba(255, 255, 255, 0.12)"
                    }
                    strokeWidth={isPathCompleted || isPathActive ? 3.5 : 2}
                    strokeDasharray={
                      isPathCompleted ? "none" : isPathActive ? "8 6" : "4 8"
                    }
                    filter={
                      isPathCompleted || isPathActive
                        ? "url(#laserGlow)"
                        : undefined
                    }
                    strokeLinecap="round"
                  />
                </g>
              );
            })}
          </svg>

          {/* DAY TOKENS & MONTH GATES */}
          <div
            className="relative z-10 w-full"
            style={{ height: `${totalSvgHeight}px` }}
          >
            {displayedDays.map((day, index) => {
              const pos = nodePositions[index] || {
                x: 250,
                y: startY + index * spacingY,
              };
              const isCompleted = day.status === "completed";
              const isCurrent = day.status === "current";
              const isMilestone =
                day.nodeType === "milestone" ||
                day.dayNumber % 15 === 0 ||
                day.dayNumber === totalDays;
              const isMonthStart =
                day.dayNumber === 1 ||
                day.dayNumber === 31 ||
                day.dayNumber === 61 ||
                day.dayNumber === 91 ||
                day.dayNumber === 121 ||
                day.dayNumber === 151;

              const mConfig = monthConfig.find(
                (m) => m.startDay === day.dayNumber
              );

              return (
                <React.Fragment key={day.id || day.dayNumber}>
                  {isMonthStart && mConfig && (
                    <div
                      style={{
                        left: "250px",
                        top: `${pos.y - 56}px`,
                        transform: "translate(-50%, -50%)",
                      }}
                      className="absolute z-20 pointer-events-none w-full max-w-sm flex flex-col items-center"
                    >
                      <div className="px-3.5 py-1 rounded-full bg-[#0D131F] border border-cyan-400/40 text-cyan-300 font-mono text-[10px] font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(34,211,238,0.25)] flex items-center gap-1.5 whitespace-nowrap backdrop-blur-md">
                        <Layers className="w-3 h-3 text-cyan-400" />
                        <span>MONTH {mConfig.month} // {mConfig.category}</span>
                      </div>
                    </div>
                  )}

                  <div
                    id={`day-node-${day.dayNumber}`}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="absolute flex flex-col items-center group cursor-pointer"
                  >
                    {isCurrent && (
                      <motion.div
                        initial={{ y: -4, opacity: 0 }}
                        animate={{ y: [0, -6, 0], opacity: 1 }}
                        transition={{
                          repeat: Infinity,
                          duration: 2.2,
                          ease: "easeInOut",
                        }}
                        className="absolute -top-11 z-30 pointer-events-none flex flex-col items-center"
                      >
                        <div className="px-3 py-0.5 rounded-full bg-cyan-400 text-[#060A12] font-mono text-[10px] font-black uppercase tracking-wider shadow-[0_0_18px_#22d3ee] flex items-center gap-1 whitespace-nowrap">
                          <MapPin className="w-3 h-3 fill-[#060A12]" />
                          <span>YOU ARE HERE // DAY {day.dayNumber}</span>
                        </div>
                        <div className="w-1.5 h-1.5 bg-cyan-400 rotate-45 -mt-1 shadow-[0_0_8px_#22d3ee]" />
                      </motion.div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.15, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => handleNodeClick(day)}
                      className={cn(
                        "relative flex items-center justify-center transition-all duration-200 select-none",
                        day.status === "locked" ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                        day.dayNumber === totalDays
                          ? "w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 border-2 border-white shadow-[0_0_35px_rgba(245,158,11,0.7)] text-slate-950"
                          : isMilestone
                          ? "w-18 h-18 rounded-2xl"
                          : "w-16 h-16 rounded-full",
                        isCompleted
                          ? "bg-[#060A12] border-2 border-cyan-400 text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.7)]"
                          : isCurrent
                          ? "bg-gradient-to-tr from-cyan-600 via-blue-600 to-cyan-400 border-2 border-white text-white shadow-[0_0_40px_rgba(34,211,238,0.9)] ring-4 ring-cyan-400/40"
                          : "bg-[#0D131F]/90 border border-white/15 text-slate-500 hover:border-white/30 hover:text-slate-300 shadow-lg"
                      )}
                    >
                      {day.dayNumber === totalDays ? (
                        <div className="flex flex-col items-center justify-center font-mono text-slate-950">
                          <Trophy className="w-6 h-6 fill-slate-950 text-slate-950" />
                          <span className="text-[10px] font-black uppercase tracking-wider -mt-0.5">
                            APEX
                          </span>
                        </div>
                      ) : isCompleted ? (
                        <div className="flex flex-col items-center justify-center font-mono">
                          <Check className="w-4 h-4 stroke-[3] text-cyan-300 drop-shadow-[0_0_8px_#22d3ee]" />
                          <span className="text-[10px] font-bold text-cyan-400/90 -mt-0.5">
                            Day {day.dayNumber}
                          </span>
                        </div>
                      ) : isCurrent ? (
                        <div className="flex flex-col items-center justify-center font-mono">
                          <Play className="w-5 h-5 fill-white text-white drop-shadow-[0_0_10px_#ffffff]" />
                          <span className="text-[10px] font-black text-cyan-100 uppercase tracking-wider -mt-0.5">
                            Day {day.dayNumber}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center font-mono">
                          <Lock className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
                          <span className="text-[10px] font-bold text-slate-500">
                            Day {day.dayNumber}
                          </span>
                        </div>
                      )}

                      {isMilestone && day.dayNumber !== totalDays && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 text-[#060A12] flex items-center justify-center shadow-[0_0_10px_#22d3ee]">
                          <Trophy className="w-3 h-3 fill-[#060A12]" />
                        </div>
                      )}
                    </motion.button>

                    <div
                      className={cn(
                        "mt-2 text-center transition-all duration-200 pointer-events-none whitespace-nowrap z-20",
                        isCurrent || hoveredDay?.id === day.id
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95"
                      )}
                    >
                      <div
                        className={cn(
                          "rounded-lg border bg-[#060A12]/95 px-2.5 py-1 shadow-md",
                          isCurrent
                            ? "border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                            : "border-white/10 text-slate-300"
                        )}
                      >
                        <span className="block text-[10px] font-mono text-slate-400">
                          Day {day.dayNumber}
                        </span>
                        <h4 className="text-sm font-bold leading-tight text-white">
                          {day.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. CLEAN FLOATING SAGA NAVIGATOR DOCK                        */}
      {/* ============================================================ */}
      <div className="sticky bottom-6 z-40 mt-6 flex justify-center">
        <div className="inline-flex items-center gap-2 p-2 rounded-2xl bg-[#0D131F]/90 border border-white/15 backdrop-blur-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] font-mono text-xs">
          <button
            type="button"
            onClick={() => scrollToDay(activeDay)}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-300 font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <MapPin className="w-3.5 h-3.5 fill-cyan-300" />
            <span>Center on Day {activeDay}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMonthFilter("all");
              scrollToDay(1);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <ArrowUp className="w-3 h-3" />
            <span>Day 1</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMonthFilter("all");
              scrollToDay(totalDays);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 transition-colors cursor-pointer flex items-center gap-1 font-bold"
          >
            <Trophy className="w-3 h-3 fill-amber-300" />
            <span>Final Day {totalDays}</span>
          </button>
        </div>
      </div>

      {activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0D131F] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.95)]">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-[10px] font-mono uppercase tracking-widest text-cyan-400">
                  Day {activeTask.dayNumber}
                </p>
                <h3 className="text-xl font-display font-bold text-white">{activeTask.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                className="text-slate-400 transition hover:text-white"
                aria-label="Close task details"
              >
                <span className="text-xl">×</span>
              </button>
            </div>

            <p className="mb-4 text-sm leading-relaxed text-slate-300">
              {activeTask.description || "Complete this curriculum task to progress your roadmap."}
            </p>
            {activeTask.deliverable && (
              <p className="mb-5 text-sm text-slate-300">
                <strong className="text-white">Deliverable:</strong> {activeTask.deliverable}
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTask(null)}
                className="rounded-lg border border-white/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:border-white/25 hover:text-white"
              >
                Close
              </button>
              {activeTask.status === "completed" ? (
                <span className="font-bold text-emerald-400">Completed</span>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCompleteTask(activeTask.id)}
                  disabled={completing}
                  className="rounded-lg bg-emerald-500 px-6 py-3 font-bold text-white transition hover:bg-emerald-600 disabled:opacity-50"
                >
                  {completing ? "Saving to Database..." : "Mark as Completed"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}