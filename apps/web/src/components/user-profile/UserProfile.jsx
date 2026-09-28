import React, { useState, useEffect } from "react";
import {
  User,
  FileText,
  Sliders,
  Bell,
  Lock,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";
import { loadUserProfile, saveUserProfile } from "./profileDefaults";
import { useTheme } from "../../context/ThemeContext";

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
import PersonalInfoSection from "./PersonalInfoSection";
import BioSection from "./BioSection";
import SocialLinksSection from "./SocialLinksSection";
import AccountPreferencesSection from "./AccountPreferencesSection";
import NotificationPreferenceSection from "./NotificationPreferenceSection";
import SecurityDataSection from "./SecurityDataSection";

export default function UserProfile({
  onNavigate = () => {},
  currentUser,
  initialSection = "all",
  onUpdateCurrentUser = () => {},
  onSignOut = () => {},
}) {
  const { theme: activeGlobalTheme, setTheme: setGlobalTheme } = useTheme();

  const [profile, setProfile] = useState(() => {
    const loaded = loadUserProfile();
    if (currentUser?.name && currentUser.name !== loaded.username) {
      return { ...loaded, username: currentUser.name, theme: activeGlobalTheme || loaded.theme };
    }
    return { ...loaded, theme: activeGlobalTheme || loaded.theme };
  });

  const [activeTab, setActiveTab] = useState(initialSection || "all");
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (activeGlobalTheme && activeGlobalTheme !== profile.theme) {
      setProfile((prev) => ({ ...prev, theme: activeGlobalTheme }));
    }
  }, [activeGlobalTheme]);

  useEffect(() => {
    if (initialSection) {
      setActiveTab(initialSection);
      if (initialSection !== "all") {
        setTimeout(() => {
          const targetEl = document.getElementById(`section-${initialSection}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 150);
      }
    }
  }, [initialSection]);

  // Sync to parent & storage on update
  const handleUpdateProfile = (updatedFields) => {
    if (updatedFields.theme && updatedFields.theme !== activeGlobalTheme) {
      setGlobalTheme(updatedFields.theme);
    }
    setProfile((prev) => {
      const next = { ...prev, ...updatedFields };
      saveUserProfile(next);
      if (updatedFields.username || updatedFields.fullName || updatedFields.avatarColor) {
        onUpdateCurrentUser({
          name: next.username,
          fullName: next.fullName,
          avatarColor: next.avatarColor,
        });
      }
      return next;
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3200);
  };

  const navItems = [
    { id: "all", label: "All Sections", icon: Layers },
    { id: "personal", label: "Personal Info", icon: User },
    { id: "bio", label: "Bio & Role Focus", icon: FileText },
    { id: "socials", label: "GitHub & Socials", icon: Github },
    { id: "preferences", label: "Preferences", icon: Sliders },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security & Data", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-[#060A12] text-[#F8FAFC] pb-24 font-sans selection:bg-cyan-500/30 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#0D131F] border border-cyan-500/40 text-cyan-300 text-xs font-mono shadow-[0_0_20px_rgba(6,182,212,0.25)] animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb / Back Bar */}
      <div className="border-b border-white/10 bg-[#0D131F]/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Workspace</span>
            </button>
            <span className="text-white/20 select-none">/</span>
            <span className="text-xs font-mono text-cyan-400">User Profile Settings</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Profile synchronized</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Profile Hero Header Card */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-r from-[#0D131F] via-[#0E1729] to-[#0D131F] p-6 md:p-8 overflow-hidden shadow-2xl mb-8">
          {/* Subtle Cyber Grid Accent */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Avatar Pill Preview */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-950 to-[#0D131F] border-2 border-cyan-400/60 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                  <User className="w-10 h-10" />
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 border-2 border-[#060A12] shadow-[0_0_8px_#22d3ee] animate-pulse" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl font-extrabold text-white tracking-tight">
                    {profile.fullName || "Rishi Kumar"}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-400/40 text-cyan-300">
                    @{profile.username || "rishi06.kk"}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 border border-emerald-400/30 text-emerald-400">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                </div>

                <p className="text-sm text-slate-300 mt-1 font-medium">{profile.title}</p>

                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs font-mono text-slate-400">
                  <span>{profile.email}</span>
                  <span className="text-white/20">•</span>
                  <span>{profile.location}</span>
                  {profile.githubUsername && (
                    <>
                      <span className="text-white/20">•</span>
                      <a
                        href={profile.githubUrl || `https://github.com/${profile.githubUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                      >
                        <Github className="w-3 h-3" />
                        <span>github.com/{profile.githubUsername}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Readiness / Stats Badge */}
            <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 rounded-2xl p-4 self-start md:self-auto">
              <div className="text-center px-3 border-r border-white/10">
                <div className="text-xs font-mono text-slate-400">Readiness</div>
                <div className="text-xl font-extrabold text-cyan-400 font-mono">84%</div>
              </div>
              <div className="text-center px-3 border-r border-white/10">
                <div className="text-xs font-mono text-slate-400">Streak</div>
                <div className="text-xl font-extrabold text-amber-400 font-mono">14d</div>
              </div>
              <div className="text-center px-3">
                <div className="text-xs font-mono text-slate-400">Theme</div>
                <div className="text-xs font-semibold text-slate-200 capitalize font-mono mt-1">
                  {profile.theme || "cyber-dark"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Grid: Left Sticky Nav + Right Content Panes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Navigation Tabs (Sticky) */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 space-y-2">
            <div className="p-2 rounded-2xl bg-[#0D131F]/90 border border-white/10 shadow-lg space-y-1">
              <div className="px-3 py-2 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Profile Sections
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isSelected = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      if (item.id !== "all") {
                        const targetEl = document.getElementById(`section-${item.id}`);
                        if (targetEl) {
                          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                      isSelected
                        ? "bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-400/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Session Indicator */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs font-mono text-slate-400 space-y-2">
              <div className="flex items-center justify-between">
                <span>Active Session</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="text-[11px] text-slate-400">
                Connected as <strong className="text-white">{profile.username}</strong>
              </div>
            </div>
          </aside>

          {/* Right Sections Container */}
          <div className="lg:col-span-3 space-y-8">
            {/* 1. Personal Info */}
            {(activeTab === "all" || activeTab === "personal") && (
              <PersonalInfoSection
                profile={profile}
                onUpdate={handleUpdateProfile}
                onNotify={showToast}
              />
            )}

            {/* 2. Bio & Focus */}
            {(activeTab === "all" || activeTab === "bio") && (
              <BioSection
                profile={profile}
                onUpdate={handleUpdateProfile}
                onNotify={showToast}
              />
            )}

            {/* 3. GitHub & Socials */}
            {(activeTab === "all" || activeTab === "socials") && (
              <SocialLinksSection
                profile={profile}
                onUpdate={handleUpdateProfile}
                onNotify={showToast}
              />
            )}

            {/* 4. Account Preferences: Theme Toggle */}
            {(activeTab === "all" || activeTab === "preferences") && (
              <AccountPreferencesSection
                profile={profile}
                onUpdate={handleUpdateProfile}
                onNotify={showToast}
              />
            )}

            {/* 5. Notification Preferences */}
            {(activeTab === "all" || activeTab === "notifications") && (
              <NotificationPreferenceSection
                profile={profile}
                onUpdate={handleUpdateProfile}
                onNotify={showToast}
              />
            )}

            {/* 6. Security & Data: Password, Export, Deletion */}
            {(activeTab === "all" || activeTab === "security") && (
              <SecurityDataSection
                profile={profile}
                onUpdate={handleUpdateProfile}
                onNotify={showToast}
                onSignOut={onSignOut}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
