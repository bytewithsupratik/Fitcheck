import React, { useState } from "react";
import { User, Mail, Sparkles, Check, ShieldCheck, Briefcase } from "lucide-react";

export default function PersonalInfoSection({ profile, onUpdate, onNotify }) {
  const [formData, setFormData] = useState({
    fullName: profile?.fullName || "Rishi Kumar",
    username: profile?.username || "rishi06.kk",
    email: profile?.email || "ashree937@gmail.com",
    title: profile?.title || "Full-Stack Systems Architect",
    avatarColor: profile?.avatarColor || "cyan",
    status: profile?.status || "online",
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    onUpdate(formData);
    setSaved(true);
    if (onNotify) onNotify("Personal information updated successfully");
    setTimeout(() => setSaved(false), 2500);
  };

  const avatarColors = [
    { id: "cyan", label: "Cyan Core", bg: "bg-cyan-500/20", border: "border-cyan-400", text: "text-cyan-300", dot: "bg-cyan-400" },
    { id: "emerald", label: "Terminal Green", bg: "bg-emerald-500/20", border: "border-emerald-400", text: "text-emerald-300", dot: "bg-emerald-400" },
    { id: "purple", label: "Cyber Violet", bg: "bg-purple-500/20", border: "border-purple-400", text: "text-purple-300", dot: "bg-purple-400" },
    { id: "amber", label: "Solar Amber", bg: "bg-amber-500/20", border: "border-amber-400", text: "text-amber-300", dot: "bg-amber-400" },
  ];

  const currentAvatarStyle = avatarColors.find((c) => c.id === formData.avatarColor) || avatarColors[0];

  return (
    <div id="section-personal" className="rounded-2xl border border-white/10 bg-[#0D131F]/90 p-6 md:p-8 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <User className="w-3.5 h-3.5" />
            <span>Identity & Credentials</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Personal Information</h2>
          <p className="text-sm text-slate-400 mt-1">Manage your public display identity, system name, and verified contact.</p>
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
        {/* Avatar customizer & status preview */}
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl ${currentAvatarStyle.bg} border ${currentAvatarStyle.border} flex items-center justify-center ${currentAvatarStyle.text} shadow-inner`}>
                <User className="w-8 h-8" />
              </div>
              <span
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${currentAvatarStyle.dot} border-2 border-[#0D131F] shadow-[0_0_8px_currentColor] animate-pulse`}
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <span>{formData.username || "rishi06.kk"}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                  ACTIVE PRO
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Avatar indicator appears in the navigation pill and dashboard stats</p>
              
              {/* Status Selector */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-mono text-slate-400">Status:</span>
                {["online", "focus", "idle"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleChange("status", st)}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded capitalize transition-colors ${
                      formData.status === st
                        ? "bg-white/15 text-white font-semibold border border-white/20"
                        : "text-slate-400 hover:text-white bg-transparent"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Avatar Color Theme */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-mono text-slate-400">Avatar Accent:</span>
            <div className="flex items-center gap-2">
              {avatarColors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => handleChange("avatarColor", color.id)}
                  title={color.label}
                  className={`w-7 h-7 rounded-lg ${color.bg} border ${color.border} flex items-center justify-center transition-transform ${
                    formData.avatarColor === color.id ? "scale-110 ring-2 ring-white/50" : "opacity-70 hover:opacity-100"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${color.dot}`} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Input Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
              Full Legal / Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.06] text-white text-sm outline-none transition-all placeholder:text-slate-500 font-sans"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Displayed on talent evaluations and resume exports.</p>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2">
              Username Handle
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-xs font-mono text-cyan-400 select-none">@</span>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                placeholder="username"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.06] text-white text-sm font-mono outline-none transition-all placeholder:text-slate-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Your unique system identifier shown in the navigation bar.</p>
          </div>

          {/* Professional Role / Title */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-cyan-400" />
              <span>Professional Title</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. Full-Stack Systems Architect"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.06] text-white text-sm outline-none transition-all placeholder:text-slate-500 font-sans"
            />
          </div>

          {/* Verified Email */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                <span>Primary Email</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified</span>
              </span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="name@domain.com"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.06] text-white text-sm outline-none transition-all placeholder:text-slate-500 font-mono"
            />
          </div>
        </div>
      </form>
    </div>
  );
}

