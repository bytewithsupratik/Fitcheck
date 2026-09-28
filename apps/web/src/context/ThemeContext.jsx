import React, { createContext, useContext, useState, useEffect } from "react";
import {
  THEME_DEFINITIONS,
  DEFAULT_THEME_ID,
  getActiveTheme,
  applyTheme,
} from "../services/themeService";

const ThemeContext = createContext({
  theme: DEFAULT_THEME_ID,
  themeConfig: THEME_DEFINITIONS[0],
  setTheme: () => {},
  availableThemes: THEME_DEFINITIONS,
  isDark: true,
});

export function ThemeProvider({ children }) {
  const [theme, setCurrentThemeState] = useState(() => getActiveTheme());

  // Apply on mount and handle state initialization
  useEffect(() => {
    const active = getActiveTheme();
    setCurrentThemeState(active);
    applyTheme(active);

    const handleThemeChange = (e) => {
      if (e?.detail?.themeId && e.detail.themeId !== theme) {
        setCurrentThemeState(e.detail.themeId);
      }
    };

    window.addEventListener("fitcheck-theme-changed", handleThemeChange);
    return () => {
      window.removeEventListener("fitcheck-theme-changed", handleThemeChange);
    };
  }, []);

  const handleSetTheme = (themeId) => {
    const applied = applyTheme(themeId);
    setCurrentThemeState(applied.id);
  };

  const currentConfig =
    THEME_DEFINITIONS.find((t) => t.id === theme) || THEME_DEFINITIONS[0];

  const contextValue = {
    theme,
    themeConfig: currentConfig,
    setTheme: handleSetTheme,
    availableThemes: THEME_DEFINITIONS,
    isDark: currentConfig.isDark,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;

