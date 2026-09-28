import React from "react";
import { Sparkles, Flame, Target, Play } from "lucide-react";

export default function WelcomeBanner({
  userName = "Learner",
  dayNumber = 1,
  streak = "0 Days",
  readiness = "25%",
  goal = "85%",
  focusTopic = "Core Architecture",
  targetRole = "Software Developer",
  onPlayDay = () => {},
}) {
  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 left-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-cyan-400">
                <Sparkles className="h-3.5 w-3.5" />
                Active Sprint: {focusTopic}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 font-mono text-xs font-semibold text-slate-300">
                Role: {targetRole}
              </span>
            </div>

            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Welcome back, <span className="text-cyan-400">{userName}</span>
            </h1>

            <p className="max-w-xl text-sm text-slate-400">
              You are on <span className="font-semibold text-white">Day {dayNumber}</span> of your learning path. Keep your momentum going and bridge your capability gaps.
            </p>
          </div>

          <div className="flex w-full flex-wrap items-center gap-4 sm:flex-nowrap lg:w-auto">
            <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 sm:flex-initial">
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-amber-400">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-mono text-xs text-slate-400">STREAK</span>
                <span className="text-lg font-bold text-white">{streak}</span>
              </div>
            </div>

            <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-800/60 px-4 py-3 sm:flex-initial">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-400">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-mono text-xs text-slate-400">READINESS</span>
                <span className="text-lg font-bold text-emerald-400">{readiness}</span>
              </div>
            </div>

            <span className="font-mono text-xs text-slate-400">Goal: {goal}</span>
            <button
              type="button"
              onClick={onPlayDay}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:bg-cyan-400 active:scale-[0.98] sm:w-auto"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>Launch Day {dayNumber}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}