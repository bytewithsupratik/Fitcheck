import { getActiveTheme, applyTheme } from "../../services/themeService";

export { applyTheme, getActiveTheme };

export const DEFAULT_USER_PROFILE = {
  // Personal Info
  username: "rishi06.kk",
  fullName: "Rishi Kumar",
  email: "ashree937@gmail.com",
  title: "Full-Stack Systems Architect",
  avatarColor: "cyan", // cyan, purple, emerald, amber
  status: "online", // online, focus, idle

  // Bio
  bio: "Systems thinker and full-stack developer passionate about high-performance web applications, distributed systems, and real-time computing.",
  location: "Bengaluru, India",
  targetRole: "Senior Full-Stack Architect",

  // Social Links
  githubUsername: "rishi06",
  githubUrl: "https://github.com/rishi06",
  githubVerified: true,

  // Account Preferences
  theme: "cyber-dark", // cyber-dark, midnight, obsidian, light
  density: "comfortable", // compact, comfortable
  codeFont: "JetBrains Mono",
  defaultLanding: "gym", // gym, forecast, home

  // Notification Preferences
  notifyDailyForecast: true,
  forecastTime: "08:00",
  notifyGymStreak: true,
  notifyWeeklyDigest: true,
  notifyPushAlerts: true,
  soundEffects: true,

  // Security & Data
  twoFactorEnabled: false,
  lastPasswordChange: "2026-08-10",
};

const STORAGE_KEY = "fitcheck_user_profile_data";

export function loadUserProfile() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const activeTheme = getActiveTheme();
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_USER_PROFILE,
        ...parsed,
        theme: parsed.theme || activeTheme || "cyber-dark",
      };
    }
    return { ...DEFAULT_USER_PROFILE, theme: activeTheme || "cyber-dark" };
  } catch (err) {
    console.warn("Failed to load profile from localStorage:", err);
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile) {
  try {
    if (profile?.theme) {
      applyTheme(profile.theme);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn("Failed to save profile to localStorage:", err);
  }
}
