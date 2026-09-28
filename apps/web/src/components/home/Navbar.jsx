import React, { useState, useRef, useEffect } from "react";
import {
  Crosshair,
  ChevronDown,
  User,
  LogOut,
  Menu,
  X,
  Sliders,
  Shield,
  Moon,
  Sun,
  Laptop,
  Monitor,
  Check,
  Palette,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const THEME_ICONS = {
  "cyber-dark": Moon,
  midnight: Laptop,
  obsidian: Monitor,
  light: Sun,
};

export default function Navbar({
  activePage = "home",
  activeTab,
  onNavigate = () => {},
  currentUser = { name: "rishi06.kk", fullName: "Rishi Kumar" },
  onSignOut = () => {},
}) {
  const { theme, setTheme, availableThemes, themeConfig } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const profileMenuRef = useRef(null);
  const themeMenuRef = useRef(null);
  const currentActive = activePage || activeTab || "home";

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setThemeMenuOpen(false);
      }
    }
    if (profileMenuOpen || themeMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuOpen, themeMenuOpen]);

  // Navigation Links
  const navLinks = [
    { id: "home", label: "Home" },
    { id: "forecast", label: "Daily Forecast" },
    { id: "gym", label: "Technical Gym" },
    { id: "dashboard", label: "Dashboard" },
  ];

  const handleNavClick = (pageId) => {
    onNavigate(pageId);
    setMobileMenuOpen(false);
  };

  const ActiveThemeIcon = THEME_ICONS[theme] || Moon;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#060A12]/90 border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand Logo & Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleNavClick("home")}
            className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none"
          >
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 border border-white/20 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Crosshair className="w-4 h-4 text-white" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-cyan-300 transition-colors font-display">
              FITCHECK
            </span>
          </button>
        </div>

        {/* Middle: Dynamic Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-[#0D131F]/90 px-4 py-1.5 rounded-full border border-white/10 shadow-inner">
          {navLinks.map((item, idx) => {
            const isActive = currentActive === item.id;
            return (
              <React.Fragment key={item.id}>
                {idx > 0 && <span className="text-[#64748B]/40 text-xs px-1 select-none">/</span>}
                <button
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`px-3.5 py-1 text-xs font-mono tracking-wider transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "text-cyan-400 font-bold border-b-2 border-cyan-400 shadow-[0_4px_12px_rgba(34,211,238,0.2)]"
                      : "text-[#E2E8F0]/80 hover:text-white hover:bg-white/5 rounded-full"
                  }`}
                >
                  {item.label}
                </button>
              </React.Fragment>
            );
          })}
        </nav>

        {/* Right: Theme Switcher, User Avatar Dropdown & Sign Out */}
        <div className="hidden sm:flex items-center gap-2.5">
          
          {/* Quick Theme Switcher Button & Menu */}
          <div className="relative" ref={themeMenuRef}>
            <button
              type="button"
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                themeMenuOpen
                  ? "border-cyan-400 bg-cyan-950/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  : "border-white/10 bg-[#0D131F] text-slate-300 hover:text-white hover:border-white/25 hover:bg-white/[0.04]"
              }`}
              title="Quick Theme Switcher"
              aria-label="Switch theme"
              aria-expanded={themeMenuOpen}
            >
              <ActiveThemeIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden lg:inline text-[11px] font-semibold capitalize">
                {themeConfig?.name ? themeConfig.name.split(" ")[0] : "Theme"}
              </span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${themeMenuOpen ? "rotate-180 text-cyan-400" : ""}`} />
            </button>

            {/* Quick Theme Switcher Dropdown */}
            {themeMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0D131F] border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.85)] p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 mb-1">
                  <Palette className="w-3 h-3 text-cyan-400" />
                  <span>Choose Theme</span>
                </div>
                <div className="space-y-1">
                  {availableThemes.map((th) => {
                    const Icon = THEME_ICONS[th.id] || Moon;
                    const isSelected = theme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          setTheme(th.id);
                          setThemeMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-all text-left cursor-pointer ${
                          isSelected
                            ? "bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                          <span className="text-[11px]">{th.name}</span>
                        </div>
                        {isSelected ? (
                          <Check className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <div className="flex gap-1 items-center">
                            {th.palette.map((c, i) => (
                              <span key={i} className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0D131F] border transition-all text-xs font-mono text-white shadow-inner cursor-pointer select-none group ${
                profileMenuOpen || currentActive === "profile"
                  ? "border-cyan-400 bg-cyan-950/30 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40"
                  : "border-white/10 hover:border-cyan-400/60 hover:bg-white/[0.04]"
              }`}
              title="Click to view User Profile & Account Settings"
              aria-label="User profile and settings"
              aria-expanded={profileMenuOpen}
            >
              <div className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
                <User className="w-3 h-3" />
              </div>
              <span className="text-slate-200 font-semibold group-hover:text-cyan-200 transition-colors">
                {currentUser?.name || "rishi06.kk"}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
              <ChevronDown
                className={`w-3 h-3 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                  profileMenuOpen ? "rotate-180 text-cyan-400" : ""
                }`}
              />
            </button>

            {/* Profile Popover Dropdown */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0D131F] border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-2 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95">
                {/* User Summary Header */}
                <div className="px-3.5 py-3 border-b border-white/10 mb-1 rounded-xl bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">
                        {currentUser?.fullName || currentUser?.name || "Rishi Kumar"}
                      </div>
                      <div className="text-[11px] font-mono text-cyan-400 truncate">
                        @{currentUser?.name || "rishi06.kk"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Items */}
                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("profile");
                      setProfileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono transition-colors text-left cursor-pointer ${
                      currentActive === "profile"
                        ? "bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-400/30"
                        : "text-slate-200 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View Profile & Account</span>
                    </div>
                    <span className="text-[10px] text-cyan-400/80 font-mono uppercase">Open</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("preferences");
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Theme & Preferences</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("security");
                      setProfileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white hover:bg-white/5 transition-colors text-left cursor-pointer"
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Security, Passwords & Data</span>
                  </button>
                </div>

                {/* Divider & Sign Out */}
                <div className="mt-1 pt-1 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sign Out Button */}
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase text-[#94A3B8] hover:text-white border border-white/10 hover:border-white/25 rounded-xl transition-all duration-200 bg-white/5 hover:bg-white/10 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">SIGN OUT</span>
          </button>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Theme Switcher Icon */}
          <button
            type="button"
            onClick={() => {
              const themeIds = availableThemes.map((t) => t.id);
              const nextIndex = (themeIds.indexOf(theme) + 1) % themeIds.length;
              setTheme(themeIds[nextIndex]);
            }}
            className="p-2 text-cyan-400 bg-[#0D131F] border border-white/10 rounded-lg cursor-pointer"
            title={`Current theme: ${theme}. Tap to cycle theme`}
            aria-label="Cycle theme"
          >
            <ActiveThemeIcon className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onSignOut}
            className="px-2.5 py-1 text-xs font-mono text-[#94A3B8] border border-white/10 rounded-lg bg-[#0D131F]"
          >
            Sign Out
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#E2E8F0] bg-[#0D131F] border border-white/10 rounded-lg cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-[#0D131F] border-b border-white/10 space-y-3">
          <div className="space-y-1">
            {navLinks.map((item) => {
              const isActive = currentActive === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full text-left block px-3 py-2 text-sm font-mono tracking-wider uppercase rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? "text-cyan-400 font-bold border-b-2 border-cyan-400 bg-cyan-500/10"
                      : "text-[#E2E8F0] hover:text-white hover:bg-white/5"
                  }`}
                >
                  // {item.label}
                </button>
              );
            })}
          </div>

          {/* Mobile Theme Selection Row */}
          <div className="pt-2 border-t border-white/10">
            <div className="text-[11px] font-mono text-slate-400 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>THEME SELECTOR</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {availableThemes.map((th) => {
                const Icon = THEME_ICONS[th.id] || Moon;
                const isSelected = theme === th.id;
                return (
                  <button
                    key={th.id}
                    type="button"
                    onClick={() => setTheme(th.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-mono text-left cursor-pointer ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-500/15 text-cyan-300 font-bold"
                        : "border-white/10 bg-white/[0.02] text-slate-300 hover:text-white"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                    <span className="truncate">{th.name.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onNavigate("profile");
                setMobileMenuOpen(false);
              }}
              className="w-full py-2 text-xs font-mono text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:text-white flex items-center justify-center gap-2"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>User Profile & Settings</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSignOut();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 text-xs font-mono uppercase tracking-wider text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl font-semibold text-center hover:bg-rose-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out ({currentUser?.name || "rishi06.kk"})</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
