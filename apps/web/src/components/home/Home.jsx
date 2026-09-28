import React, { useState, useEffect } from "react";
import Navbar from "./Navbar.jsx";
import WelcomeBanner from "./WelcomeBanner.jsx";
import QuickStatusBar from "./QuickStatusBar.jsx";
import CandyCrushRoadmap from "./CandyCrushRoadmap.jsx";
import DailyForecast from "../daily-forecast";
import TechnicalGym from "../technical-gym";
import Dashboard from "../dashboard";
import UserProfile from "../user-profile";
import { dashboardService } from "../../services/dashboardService";
import { Crosshair } from "lucide-react";

export default function Home({
  currentUser = {},
  onSignOut = () => {},
  onNavigate = () => {},
  onReconfigureOnboarding = () => {},
}) {
  const [activeTab, setActiveTab] = useState("home");
  const [userProfileData, setUserProfileData] = useState(currentUser);
  
  // Real Server Metrics state (initialized with safe defaults)
  const [liveMetrics, setLiveMetrics] = useState({
    readiness: "30%",
    streak: "1 Day",
    goal: "85%",
    velocity: "Standard",
    metrics: {
      dayNumber: 1,
      target: currentUser?.targetRole || "CSS",
    },
  });

  // 1. Fetch live metrics from Node backend (GET /dashboard/metrics)
  useEffect(() => {
    const token = localStorage.getItem("fitcheck_auth_token");

    if (!token) {
      console.log("[Home] No auth token found. Skipping protected dashboard metrics fetch.");
      return;
    }

    dashboardService
      .getMetrics()
      .then((data) => {
        console.log("[Home] Live dashboard metrics loaded:", data);
        setLiveMetrics(data);
      })
      .catch((err) => {
        console.warn("[Home] Could not load live dashboard metrics:", err);
      });
  }, []);

  const scrollToRoadmap = () => {
    if (activeTab !== "home") {
      setActiveTab("home");
    }
    setTimeout(() => {
      const activeNode = document.querySelector('[data-status="current"]') || document.getElementById("roadmap-tree");
      if (activeNode) {
        activeNode.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleTabNavigate = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: "smooth" });
    onNavigate(tabId);
  };

  const handlePlayDay = () => {
    handleTabNavigate("forecast");
  };

  // Derive active values prioritizing live database metrics
  const activeUser = {
    ...currentUser,
    ...userProfileData,
    dayNumber: liveMetrics.metrics?.dayNumber || 1,
    streak: liveMetrics.streak,
    readiness: liveMetrics.readiness,
    goal: liveMetrics.goal,
    targetRole: liveMetrics.metrics?.target || currentUser?.targetRole || "CSS",
    focusTopic: liveMetrics.metrics?.target || "CSS",
  };

  return (
    <div className="min-h-screen bg-[#060A12] text-[#F8FAFC] font-sans antialiased selection:bg-cyan-500/30 selection:text-white relative overflow-x-hidden pb-16">
      {/* 1. Dynamic Authenticated Workspace Navbar */}
      <Navbar
        currentUser={activeUser}
        activeTab={activeTab}
        activePage={activeTab}
        onNavigate={handleTabNavigate}
        onSignOut={onSignOut}
      />

      {/* 2. Authenticated Flow Content */}
      <main className="relative z-10 pt-4 pb-12 space-y-4">
        {activeTab === "forecast" ? (
          <DailyForecast onNavigate={handleTabNavigate} />
        ) : activeTab === "gym" ? (
          <TechnicalGym onNavigate={handleTabNavigate} />
        ) : activeTab === "dashboard" ? (
          <Dashboard
            currentUser={activeUser}
            onNavigate={handleTabNavigate}
          />
        ) : activeTab === "profile" || activeTab === "preferences" || activeTab === "security" ? (
          <UserProfile
            currentUser={activeUser}
            initialSection={
              activeTab === "preferences"
                ? "preferences"
                : activeTab === "security"
                ? "security"
                : "all"
            }
            onNavigate={handleTabNavigate}
            onUpdateCurrentUser={(updated) => {
              setUserProfileData((prev) => ({ ...prev, ...updated }));
            }}
            onSignOut={onSignOut}
          />
        ) : (
          /* HOME TAB */
          <>
            {/* 1. Live Welcome Banner */}
            <WelcomeBanner
              userName={activeUser.preferredName || activeUser.username || "Alex"}
              dayNumber={activeUser.dayNumber}
              streak={activeUser.streak}
              readiness={activeUser.readiness}
              goal={activeUser.goal}
              focusTopic={activeUser.focusTopic}
              targetRole={activeUser.targetRole}
              onPlayDay={handlePlayDay}
            />

            {/* 2. Live Quick Status Bar */}
            <QuickStatusBar
              sessionStatus={activeUser.sessionStatus || "Ready"}
              targetRole={activeUser.targetRole}
              todayFocus={activeUser.focusTopic}
            />

            {/* 3. Live Candy Crush Roadmap */}
            <div id="roadmap-tree">
              <CandyCrushRoadmap
                targetRole={activeUser.targetRole}
                currentDay={activeUser.dayNumber}
                onSelectDay={() => handleTabNavigate("forecast")}
              />
            </div>
          </>
        )}
      </main>

      {/* 3. Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#060A12] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold tracking-tight text-white font-display">
              FITCHECK
            </span>
            <span className="text-xs text-[#64748B] font-mono">
              // TELEMETRY MONITORED // &copy; {new Date().getFullYear()} FitCheck Inc.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-mono text-[#94A3B8]">
            <button
              type="button"
              onClick={() => handleTabNavigate("home")}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleTabNavigate("forecast")}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Daily Forecast
            </button>
            <button
              type="button"
              onClick={scrollToRoadmap}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Day Road
            </button>
            <button
              type="button"
              onClick={onReconfigureOnboarding}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Reconfigure Goals
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="hover:text-rose-400 transition-colors underline underline-offset-4 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}