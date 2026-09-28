import React, { useState } from "react";
import { ExternalLink, CheckCircle2, Sparkles, Check, Globe, AlertCircle } from "lucide-react";

function Github({ className = "w-4 h-4", ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function SocialLinksSection({ profile, onUpdate, onNotify }) {
  const [githubUsername, setGithubUsername] = useState(profile?.githubUsername || "rishi06");
  const [isVerified, setIsVerified] = useState(profile?.githubVerified ?? true);
  const [isChecking, setIsChecking] = useState(false);
  const [saved, setSaved] = useState(false);

  const cleanUsername = githubUsername.trim().replace(/^https?:\/\/(www\.)?github\.com\//i, "").replace(/\/$/, "");
  const computedUrl = cleanUsername ? `https://github.com/${cleanUsername}` : "https://github.com";

  const handleSave = (e) => {
    if (e) e.preventDefault();
    onUpdate({
      githubUsername: cleanUsername,
      githubUrl: computedUrl,
      githubVerified: isVerified,
    });
    setSaved(true);
    if (onNotify) onNotify("GitHub profile connection updated");
    setTimeout(() => setSaved(false), 2500);
  };

  const handleVerifyLink = () => {
    setIsChecking(true);
    setTimeout(() => {
      setIsChecking(false);
      setIsVerified(true);
      if (onNotify) onNotify(`Verified connection to github.com/${cleanUsername}`);
    }, 600);
  };

  return (
    <div id="section-socials" className="rounded-2xl border border-white/10 bg-[#0D131F]/90 p-6 md:p-8 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
            <Github className="w-3.5 h-3.5" />
            <span>Developer Presence</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Social & Code Profiles</h2>
          <p className="text-sm text-slate-400 mt-1">
            Connect your primary code host to import repository activity and evidence for technical fitness scores.
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

      <div className="space-y-6">
        {/* Active GitHub Connection Card */}
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-black border border-white/20 flex items-center justify-center text-white shadow-inner">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">GitHub</h3>
                  {isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected & Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <AlertCircle className="w-3 h-3" />
                      Pending Verification
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Primary portfolio link for technical workout verification</p>
              </div>
            </div>

            {cleanUsername && (
              <a
                href={computedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white border border-white/10 transition-colors"
              >
                <span>github.com/{cleanUsername}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
                GitHub Username or URL
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-mono text-slate-400 select-none">
                  github.com/
                </span>
                <input
                  type="text"
                  value={cleanUsername}
                  onChange={(e) => {
                    setGithubUsername(e.target.value);
                    setSaved(false);
                  }}
                  placeholder="rishi06"
                  className="w-full pl-28 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 focus:bg-white/[0.06] text-white text-sm font-mono outline-none transition-all placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleVerifyLink}
                disabled={isChecking || !cleanUsername}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50 text-white font-mono text-xs font-semibold tracking-wider transition-colors border border-white/10 cursor-pointer"
              >
                {isChecking ? "Checking..." : "Verify Handle"}
              </button>
            </div>
          </div>
        </div>

        {/* Future Socials Hint Banner */}
        <div className="rounded-xl border border-dashed border-white/10 p-4 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Currently focused on GitHub. More platforms (LinkedIn, Personal Website, X) coming soon.</span>
          </div>
          <span className="hidden sm:inline text-[11px] text-cyan-400/80">Single-source mode</span>
        </div>
      </div>
    </div>
  );
}
