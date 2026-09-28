import React, { useState } from "react";
import {
  Lock,
  Download,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  X,
  ShieldCheck,
} from "lucide-react";

export default function SecurityDataSection({ profile, onUpdate, onNotify, onSignOut }) {
  // Password State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ state: "idle", message: "" });

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState("");

  // Password strength calculator
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 1:
        return { score: 25, label: "Weak", color: "bg-rose-500" };
      case 2:
        return { score: 50, label: "Fair", color: "bg-amber-500" };
      case 3:
        return { score: 75, label: "Good", color: "bg-cyan-500" };
      case 4:
        return { score: 100, label: "Strong", color: "bg-emerald-500" };
      default:
        return { score: 15, label: "Very Weak", color: "bg-rose-600" };
    }
  };

  const strength = getPasswordStrength(newPassword);

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordStatus({ state: "error", message: "Please enter your current password." });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordStatus({ state: "error", message: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ state: "error", message: "New passwords do not match." });
      return;
    }

    setPasswordStatus({ state: "success", message: "Password updated successfully!" });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    if (onNotify) onNotify("Security credentials and password updated");

    setTimeout(() => {
      setPasswordStatus({ state: "idle", message: "" });
    }, 4000);
  };

  // Export Data Handler (JSON)
  const handleExportJSON = () => {
    const exportPayload = {
      exportDate: new Date().toISOString(),
      platform: "FitCheck OS",
      userProfile: profile,
      systemMetrics: {
        readinessScore: 84,
        completedMilestones: 12,
        streakDays: 14,
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `fitcheck_user_${profile?.username || "profile"}_data.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (onNotify) onNotify("Profile and system data exported as JSON");
  };

  // Export Data Handler (CSV)
  const handleExportCSV = () => {
    const csvContent = [
      ["Attribute", "Value"],
      ["Username", profile?.username || "rishi06.kk"],
      ["Full Name", profile?.fullName || "Rishi Kumar"],
      ["Email", profile?.email || "ashree937@gmail.com"],
      ["Role", profile?.title || "Full-Stack Systems Architect"],
      ["GitHub", profile?.githubUrl || "https://github.com/rishi06"],
      ["Exported At", new Date().toISOString()],
    ]
      .map((row) => row.map((val) => `"${val}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fitcheck_user_profile.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (onNotify) onNotify("Profile data exported as CSV");
  };

  // Account Deletion Handler
  const handleConfirmDelete = () => {
    if (deleteConfirmationInput.trim().toUpperCase() !== "DELETE") return;
    try {
      localStorage.removeItem("fitcheck_user_profile_data");
      localStorage.removeItem("fitcheck_is_authenticated");
    } catch (e) {
      console.error(e);
    }
    setIsDeleteModalOpen(false);
    if (onNotify) onNotify("Account deleted. Resetting workspace...");
    setTimeout(() => {
      if (onSignOut) {
        onSignOut();
      } else {
        window.location.reload();
      }
    }, 800);
  };

  return (
    <div id="section-security" className="rounded-2xl border border-white/10 bg-[#0D131F]/90 p-6 md:p-8 backdrop-blur-sm shadow-xl space-y-8">
      {/* Section Header */}
      <div className="border-b border-white/10 pb-6">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
          <Lock className="w-3.5 h-3.5" />
          <span>Privacy & Governance</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Security & Data Management</h2>
        <p className="text-sm text-slate-400 mt-1">
          Update account access credentials, download your complete personal records, or permanently erase your profile.
        </p>
      </div>

      {/* 1. Change Password Form */}
      <div>
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Change Access Password</span>
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-xl">
          {/* Current Password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 text-white text-sm outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              New Secure Password
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 text-white text-sm outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength bar */}
            {newPassword && (
              <div className="mt-2 space-y-1">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${strength.color} transition-all duration-300`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>Strength: <strong className="text-white">{strength.label}</strong></span>
                  <span>Min. 8 chars, numbers & symbols</span>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-cyan-400 text-white text-sm outline-none font-mono"
            />
          </div>

          {/* Feedback message */}
          {passwordStatus.state === "error" && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{passwordStatus.message}</span>
            </div>
          )}

          {passwordStatus.state === "success" && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordStatus.message}</span>
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-mono font-semibold tracking-wider transition-colors border border-white/10 cursor-pointer"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* 2. Data Portability / Export */}
      <div className="pt-6 border-t border-white/5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-2 flex items-center gap-2">
          <Download className="w-4 h-4 text-cyan-400" />
          <span>Export Account Data</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4 max-w-2xl">
          Under privacy principles, you have complete ownership of your fitness scores, resume evidence, and settings.
          Download an archival copy at any moment.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExportJSON}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-mono border border-white/10 transition-colors cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-cyan-400" />
            <span>Export as JSON (.json)</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-mono border border-white/10 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Summary as CSV (.csv)</span>
          </button>
        </div>
      </div>

      {/* 3. Danger Zone: Account Deletion */}
      <div className="pt-6 border-t border-rose-500/20">
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/10 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Danger Zone</span>
            </div>
            <h4 className="text-base font-bold text-white">Delete Account & Scrub All Records</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Permanently remove your account, technical readiness radar history, solved gym algorithms, and connected GitHub handles. This action cannot be reversed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteConfirmationInput("");
              setIsDeleteModalOpen(true);
            }}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(225,29,72,0.3)] cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl bg-[#0D131F] border border-rose-500/40 p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Are you absolutely sure?</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This will permanently delete your user profile (<strong>{profile?.username}</strong>), all gym workout
              progress, saved roadmaps, and local credentials.
            </p>

            <div className="mb-4">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Type <strong className="text-rose-400">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-lg bg-black/50 border border-white/20 text-white text-sm font-mono outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-mono"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput.trim().toUpperCase() !== "DELETE"}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(225,29,72,0.4)]"
              >
                Erase Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

