import React, { useState } from "react";
import { FileText, MapPin, Target, Sparkles, Check } from "lucide-react";

export default function BioSection({ profile, onUpdate, onNotify }) {
  const [formData, setFormData] = useState({
    bio: profile?.bio || "Systems thinker and full-stack developer passionate about high-performance web applications, distributed systems, and real-time computing.",
    location: profile?.location || "Bengaluru, India",
    targetRole: profile?.targetRole || "Senior Full-Stack Architect",
  });

  const [saved, setSaved] = useState(false);
  const MAX_BIO_LENGTH = 280;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    onUpdate(formData);
    setSaved(true);
    if (onNotify) onNotify("Bio and profile description updated");
    setTimeout(() => setSaved(false), 2500);
  };

  const quickBioSuggestions = [
    "Building high-throughput microservices and crafting pixel-perfect interfaces with React & Tailwind.",
    "Focused on algorithmic optimization, low-latency system design, and competitive coding milestones.",
    "Senior architect scaling web architectures with modern TypeScript, distributed state, and clean UI.",
  ];

  return (
    <div id="section-bio" className="rounded-2xl border border-white/10 bg-[#0D131F]/90 p-6 md:p-8 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Developer Narrative</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Bio & Role Focus</h2>
          <p className="text-sm text-slate-400 mt-1">
            Tell the community and hiring systems about your technical mindset and professional trajectory.
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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Bio Text Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
              Biography & Summary
            </label>
            <span
              className={`text-xs font-mono ${
                formData.bio.length > MAX_BIO_LENGTH - 20 ? "text-amber-400" : "text-slate-400"
              }`}
            >
              {formData.bio.length} / {MAX_BIO_LENGTH}
            </span>
          </div>

          <textarea
            rows={4}
            maxLength={MAX_BIO_LENGTH}
            value={formData.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            placeholder="Write a brief overview of your technical background, current focus, and what you are learning..."
            className="w-full px-4 py-3 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.06] text-white text-sm outline-none transition-all placeholder:text-slate-500 resize-none font-sans leading-relaxed"
          />

          {/* Quick suggestions */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Quick templates:</span>
            {quickBioSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleChange("bio", suggestion)}
                className="text-[11px] text-slate-300 hover:text-cyan-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg border border-white/5 transition-colors cursor-pointer text-left truncate max-w-xs"
              >
                "{suggestion.slice(0, 38)}..."
              </button>
            ))}
          </div>
        </div>

        {/* Location and Target Role */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Target Role */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Role / Objective</span>
            </label>
            <input
              type="text"
              value={formData.targetRole}
              onChange={(e) => handleChange("targetRole", e.target.value)}
              placeholder="e.g. Senior Systems Architect"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.06] text-white text-sm outline-none transition-all placeholder:text-slate-500 font-sans"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Geographic Location</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              placeholder="e.g. San Francisco, CA or Remote"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.06] text-white text-sm outline-none transition-all placeholder:text-slate-500 font-sans"
            />
          </div>
        </div>
      </form>
    </div>
  );
}

