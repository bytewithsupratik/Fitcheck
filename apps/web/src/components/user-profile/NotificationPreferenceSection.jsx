import React, { useState } from "react";
import { Bell, Flame, Calendar, Sparkles, Check, Clock, Volume2, Shield } from "lucide-react";

export default function NotificationPreferenceSection({ profile, onUpdate, onNotify }) {
  const [prefs, setPrefs] = useState({
    notifyDailyForecast: profile?.notifyDailyForecast ?? true,
    forecastTime: profile?.forecastTime || "08:00",
    notifyGymStreak: profile?.notifyGymStreak ?? true,
    notifyWeeklyDigest: profile?.notifyWeeklyDigest ?? true,
    notifyPushAlerts: profile?.notifyPushAlerts ?? true,
    soundEffects: profile?.soundEffects ?? true,
  });

  const [saved, setSaved] = useState(false);

  const toggle = (key) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    onUpdate(prefs);
    setSaved(true);
    if (onNotify) onNotify("Notification preferences updated");
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div id="section-notifications" className="rounded-2xl border border-white/10 bg-[#0D131F]/90 p-6 md:p-8 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <Bell className="w-3.5 h-3.5" />
            <span>Reminders & Alerts</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Notification Preferences</h2>
          <p className="text-sm text-slate-400 mt-1">
            Configure how and when you receive tactical reminders, workout alerts, and progress reports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
        >
          {saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          <span>{saved ? "Saved" : "Save Changes"}</span>
        </button>
      </div>

      <div className="space-y-4">
        {/* Daily Forecast Reminder */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center text-cyan-300 mt-0.5">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Daily Forecast Missions</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive morning notification when daily recommended checklist & videos update.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:self-center">
            {prefs.notifyDailyForecast && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-slate-300">
                <Clock className="w-3 h-3 text-cyan-400" />
                <input
                  type="time"
                  value={prefs.forecastTime}
                  onChange={(e) => {
                    setPrefs((p) => ({ ...p, forecastTime: e.target.value }));
                    setSaved(false);
                  }}
                  className="bg-transparent text-white outline-none font-mono text-xs"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => toggle("notifyDailyForecast")}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                prefs.notifyDailyForecast ? "bg-cyan-500" : "bg-white/10"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  prefs.notifyDailyForecast ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Technical Gym Streak Protection */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-300 mt-0.5">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Streak Freeze Alerts</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Urgent notification 3 hours before daily reset if your technical gym streak is in jeopardy.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggle("notifyGymStreak")}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
              prefs.notifyGymStreak ? "bg-cyan-500" : "bg-white/10"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.notifyGymStreak ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Weekly Digest */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-400/30 flex items-center justify-center text-purple-300 mt-0.5">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Weekly Readiness Scorecard</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive Monday briefing summarising milestone completion, score delta, and radar shift.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggle("notifyWeeklyDigest")}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
              prefs.notifyWeeklyDigest ? "bg-cyan-500" : "bg-white/10"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.notifyWeeklyDigest ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Sound Effects & Audio feedback */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/10 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mt-0.5">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Tactical Haptic & Audio Cues</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Subtle mechanical audio click when completing tasks, coding gym challenges, and unlocking badges.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => toggle("soundEffects")}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
              prefs.soundEffects ? "bg-cyan-500" : "bg-white/10"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                prefs.soundEffects ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

