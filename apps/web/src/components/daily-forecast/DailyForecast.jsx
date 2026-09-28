import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Video,
  BookOpen,
  Code2,
  ExternalLink,
  Sparkles,
  Flame,
  ArrowRight,
} from "lucide-react";
import { learningService } from "../../services/learningService";

export default function DailyForecast({ onNavigate }) {
  const [experience, setExperience] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);
  const [codingProject, setCodingProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completingStep, setCompletingStep] = useState(null);

  // 1. Fetch live MIE learning experience on mount
  useEffect(() => {
    async function loadForecast() {
      try {
        setLoading(true);
        setError(null);

        const expData = await learningService.getCurrentExperience();
        console.log("[DailyForecast] Active experience loaded for target:", expData?.target_id);

        setExperience(expData);
        setTasks((expData.sequence || []).map((step) => ({
          id: step.step,
          title: step.title,
          type: step.type,
          itemId: step.item_id,
          completed: step.status === "COMPLETED",
          duration: step.type === "RESOURCE" ? "20m" : step.type === "PROJECT" ? "60m" : "15m",
        })));
        setResources(expData.resources || []);
        setCodingProject(expData.coding_project || null);
      } catch (err) {
        console.error("[DailyForecast] Error loading experience:", err);
        setError(err.message || "Failed to load today's learning forecast");
      } finally {
        setLoading(false);
      }
    }

    loadForecast();
  }, []);

  // 2. Handle step completion (POST /learning/experiences/:id/steps/:stepId/complete)
  const handleToggleTask = async (task) => {
    if (!experience?.experience_id || task.completed || completingStep) return;

    try {
      setCompletingStep(task.id);
      await learningService.completeStep(experience.experience_id, task.id);

      // Optimistically mark completed in UI
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, completed: true } : t))
      );
    } catch (err) {
      console.error("[DailyForecast] Failed to complete step:", err);
      alert(err.message || "Could not complete learning step.");
    } finally {
      setCompletingStep(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-cyan-400">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide">Synthesizing today's adaptive forecast...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-red-950/20 border border-red-800/60 rounded-2xl text-center text-red-300">
        <p className="font-semibold text-lg mb-2">Forecast Unavailable</p>
        <p className="text-sm text-red-400 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 bg-red-900/60 hover:bg-red-800 text-white rounded-lg text-xs font-bold uppercase transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/50 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sparkles className="w-3.5 h-3.5 inline mr-1" />
              MIE Synthesized Sprint
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Target: {experience?.target_id || "Full Stack Developer"}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-display">
            Daily Learning Forecast
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Complete your daily sequenced curriculum to bridge target capability gaps.
          </p>
        </div>

        {/* Sprint Progress Pill */}
        <div className="flex items-center gap-4 bg-slate-800/60 border border-slate-700/60 px-5 py-3 rounded-xl">
          <div>
            <span className="text-xs text-slate-400 font-mono block">TODAY'S COMPLETION</span>
            <span className="text-xl font-bold text-white">{completedCount} of {tasks.length} Done ({progressPct}%)</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-cyan-400 flex items-center justify-center font-bold text-xs text-cyan-400">
            {progressPct}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Sequenced Checklist */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
              <span>Sequence Steps</span>
              <span className="text-xs font-mono text-cyan-400 font-normal">Auto-Advancing</span>
            </h2>

            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => handleToggleTask(task)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                    task.completed
                      ? "bg-emerald-950/20 border-emerald-800/40 text-slate-300"
                      : "bg-slate-800/40 hover:bg-slate-800/80 border-slate-700/60 text-white"
                  }`}
                >
                  <button className="mt-0.5 text-cyan-400">
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-snug ${task.completed ? "line-through text-slate-400" : ""}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 font-mono">
                      <span className="uppercase text-cyan-400">{task.type}</span>
                      <span>•</span>
                      <span>{task.duration}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Project Highlight */}
          {codingProject && (
            <div className="bg-gradient-to-b from-cyan-950/20 to-slate-900/80 border border-cyan-800/30 rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-400 font-semibold uppercase">
                  Featured Mission
                </span>
                <Code2 className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white">{codingProject.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                {codingProject.description}
              </p>
              <div className="pt-2">
                <span className="text-xs font-mono text-slate-500">
                  Estimated duration: {codingProject.estimated_duration_minutes || 120} mins
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Columns: Curated Learning Resources */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
              <span>Curated Study Resources</span>
              <span className="text-xs font-mono text-slate-400">Ranked by MIE Relevance</span>
            </h2>

            {resources.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">
                No external resources attached to this step. Focus on your active coding project.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resources.map((res, idx) => {
                  const isVideo = res.type === "VIDEO";
                  return (
                    <div
                      key={`${res.resource_id || "res"}-${idx}`}
                      className="bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 rounded-xl p-5 flex flex-col justify-between transition-all group"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono uppercase bg-slate-700 text-slate-300">
                            {isVideo ? <Video className="w-3 h-3 text-cyan-400" /> : <BookOpen className="w-3 h-3 text-amber-400" />}
                            {res.type}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {res.estimated_duration_minutes} min
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-2">
                          {res.title}
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {res.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-700/40 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">
                          Source: {res.source || "Official Spec"}
                        </span>
                        {res.url ? (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500 font-mono">In-App Module</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}