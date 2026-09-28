/**
 * Service: Theme Management & Architecture
 * 
 * Provides an extensible, backend-ready service layer for theme settings.
 * Designed to seamlessly connect to PostgreSQL, Supabase, Firebase, or any REST/GraphQL API.
 */

export const THEME_DEFINITIONS = [
  {
    id: "cyber-dark",
    name: "Cyber Dark (Default)",
    tagline: "Ultra-deep void with electric cyan accents",
    description: "Ultra-deep #060A12 background with electric cyan accents.",
    palette: ["#060A12", "#0D131F", "#06B6D4"],
    accentHex: "#06B6D4",
    bgHex: "#060A12",
    surfaceHex: "#0D131F",
    textHex: "#F8FAFC",
    isDark: true,
  },
  {
    id: "midnight",
    name: "Midnight Violet",
    tagline: "Cosmic deep space with electric violet & royal indigo glow",
    description: "Deep cosmic slate with electric violet & royal indigo neon glow.",
    palette: ["#080C1E", "#111736", "#8B5CF6"],
    accentHex: "#8B5CF6",
    bgHex: "#080C1E",
    surfaceHex: "#111736",
    textHex: "#F8FAFC",
    isDark: true,
  },
  {
    id: "obsidian",
    name: "Obsidian Matrix",
    tagline: "Carbon obsidian black with vivid neon emerald green",
    description: "Sleek carbon black with luminous high-tech neon emerald accents.",
    palette: ["#070A08", "#0E1511", "#10B981"],
    accentHex: "#10B981",
    bgHex: "#070A08",
    surfaceHex: "#0E1511",
    textHex: "#F8FAFC",
    isDark: true,
  },
  {
    id: "light",
    name: "Solar Daylight",
    tagline: "Clean editorial daylight canvas with brilliant azure sapphire",
    description: "High-contrast editorial daylight canvas with brilliant azure sapphire.",
    palette: ["#F8FAFC", "#FFFFFF", "#0284C7"],
    accentHex: "#0284C7",
    bgHex: "#F8FAFC",
    surfaceHex: "#FFFFFF",
    textHex: "#0F172A",
    isDark: false,
  },
];

const THEME_STORAGE_KEY = "fitcheck_theme_preference";
export const DEFAULT_THEME_ID = "cyber-dark";

/**
 * Returns list of available theme configurations
 */
export function getAvailableThemes() {
  return THEME_DEFINITIONS;
}

/**
 * Retrieves the currently active theme ID from local storage or defaults
 */
export function getActiveTheme() {
  try {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored && THEME_DEFINITIONS.some((t) => t.id === stored)) {
        return stored;
      }
    }
  } catch (err) {
    console.warn("[themeService] Error reading theme from localStorage:", err);
  }
  return DEFAULT_THEME_ID;
}

/**
 * Applies a theme ID to the DOM and persists it locally.
 * Returns the resolved theme definition.
 */
export function applyTheme(themeId) {
  const validTheme = THEME_DEFINITIONS.find((t) => t.id === themeId) || THEME_DEFINITIONS[0];
  const targetId = validTheme.id;

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", targetId);
    if (validTheme.isDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }

  try {
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, targetId);
      window.dispatchEvent(
        new CustomEvent("fitcheck-theme-changed", { detail: { themeId: targetId } })
      );
    }
  } catch (err) {
    console.warn("[themeService] Error saving theme to localStorage:", err);
  }

  return validTheme;
}

/**
 * Future Backend / Database Sync Adapter
 * Call this when a user logs in or updates preferences to synchronize with remote DB.
 */
export async function syncThemeWithBackend(userId, themeId) {
  // Plug your backend endpoint here:
  // e.g. await fetch(`/api/users/${userId}/preferences`, { method: 'PATCH', body: JSON.stringify({ theme: themeId }) });
  return { success: true, themeId, syncedAt: new Date().toISOString() };
}

