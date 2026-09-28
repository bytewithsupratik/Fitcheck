import React, { useState, useEffect } from "react";
import { Sliders, Moon, Sun, Monitor, Laptop, Sparkles, Check, LayoutGrid, Type } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function AccountPreferencesSection({ profile, onUpdate, onNotify }) {
  const { theme: activeGlobalTheme, setTheme: setGlobalTheme } = useTheme();

  const [preferences, setPreferences] = useState({
    theme: profile?.theme || activeGlobalTheme || "cyber-dark",
    density: profile?.density || "comfortable",
    defaultLanding: profile?.defaultLanding || "gym",
    codeFont: profile?.codeFont || "JetBrains Mono",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (activeGlobalTheme && activeGlobalTheme !== preferences.theme) {
      setPreferences((prev) => ({ ...prev, theme: activeGlobalTheme }));
    }
  }, [activeGlobalTheme]);

  const themeOptions = [
    {
      id: "cyber-dark",
      name: "Cyber Dark (Default)",
      description: "Ultra-deep #060A12 background with electric cyan accents.",
      icon: Moon,
      palette: ["#060A12", "#0D131F", "#06B6D4"],
    },
    {
      id: "midnight",
      name: "Midnight Violet",
      description: "Cosmic deep space with electric violet & royal indigo glow.",
      icon: Laptop,
      palette: ["#080C1E", "#111736", "#8B5CF6"],
    },
    {
      id: "obsidian",
      name: "Obsidian Matrix",
      description: "Sleek carbon black with luminous high-tech neon emerald accents.",
      icon: Monitor,
      palette: ["#070A08", "#0E1511", "#10B981"],
    },
    {
      id: "light",
      name: "Solar Daylight",
      description: "High-contrast editorial daylight canvas with brilliant azure sapphire.",
      icon: Sun,
      palette: ["#F8FAFC", "#FFFFFF", "#0284C7"],
    },
  ];

  const handleThemeSelect = (themeId) => {
    setGlobalTheme(themeId);
    const updated = { ...preferences, theme: themeId };
    setPreferences(updated);
    if (onUpdate) onUpdate(updated);
    const chosen = themeOptions.find((t) => t.id === themeId);
    if (onNotify) onNotify(`Theme switched to ${chosen?.name || themeId}`);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    setGlobalTheme(preferences.theme);
    onUpdate(preferences);
    setSaved(true);
    if (onNotify) onNotify(`Theme set to ${preferences.theme} and preferences saved`);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div id="section-preferences" className="rounded-2xl border border-white/10 bg-[#0D131F]/90 p-6 md:p-8 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>App Experience</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Account Preferences</h2>
          <p className="text-sm text-slate-400 mt-1">
            Customize visual theme, UI density, and default workspace environment.
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

      <div className="space-y-8">
        {/* Theme Toggle Section */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-3">
            Theme & Visual Ambiance
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {themeOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = preferences.theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleThemeSelect(opt.id)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/50"
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                      )}
                    </div>
                    <div className="text-sm font-semibold text-white">{opt.name}</div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {opt.description}
                    </p>
                  </div>

                  {/* Color chips */}
                  <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-white/5">
                    {opt.palette.map((hex, i) => (
                      <span
                        key={i}
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: hex }}
                        title={hex}
                      />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* UI Density & Monospace Font */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
          {/* Density */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Workspace Density</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "comfortable", label: "Comfortable", desc: "Spacious padding & breathing room" },
                { id: "compact", label: "Compact", desc: "Higher information density" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPreferences((p) => ({ ...p, density: item.id }));
                    setSaved(false);
                  }}
                  className={`p-3 rounded-xl border text-left text-xs transition-colors cursor-pointer ${
                    preferences.density === item.id
                      ? "border-cyan-400 bg-cyan-500/10 text-white font-semibold"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-white font-medium">{item.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Monospace Code Font */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              <span>Code & Terminal Font</span>
            </label>
            <select
              value={preferences.codeFont}
              onChange={(e) => {
                setPreferences((p) => ({ ...p, codeFont: e.target.value }));
                setSaved(false);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#060A12] border border-white/10 text-white text-xs font-mono outline-none focus:border-cyan-400"
            >
              <option value="JetBrains Mono">JetBrains Mono (System Default)</option>
              <option value="Fira Code">Fira Code (Ligatures)</option>
              <option value="Geist Mono">Geist Mono</option>
              <option value="ui-monospace">System Monospace</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Applied across technical gym code challenges and roadmaps.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

