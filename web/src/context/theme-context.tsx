"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";
/** What the person chose. "system" defers to the OS, and keeps deferring. */
export type ThemeChoice = Theme | "system";

const KEY = "oxar-theme";

interface ThemeContextType {
  /** What is actually on screen right now. */
  theme: Theme;
  /** What was asked for — the setting, which may be "system". */
  choice: ThemeChoice;
  setChoice: (c: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  choice: "system",
  setChoice: () => {},
});

/** The OS preference, read once. */
function systemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Which of the two palettes is live.
 *
 * The value lands on `<html data-theme>`, where the CSS variables in globals.css
 * pick it up — every colour in the app is one of those variables, so nothing else
 * has to know a theme exists.
 *
 * "system" is a real third state, not a default that gets frozen the first time it
 * is read: someone whose phone turns dark at sunset expects the app to follow, and
 * that only works if we keep listening.
 *
 * The first paint is set by an inline script in the document head, before React
 * runs — otherwise a dark-theme user gets a white flash on every load.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>("system");
  const [theme, setTheme] = useState<Theme>("light");

  const apply = useCallback((next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as ThemeChoice | null;
    // Light until asked otherwise. "system" is offered, not assumed: a dark theme
    // nobody has looked at yet shouldn't arrive by itself on every phone that
    // happens to be in dark mode. Flip this default once it has been through a
    // proper look.
    const initial: ThemeChoice =
      saved === "light" || saved === "dark" || saved === "system" ? saved : "light";
    setChoiceState(initial);
    apply(initial === "system" ? systemTheme() : initial);

    // Keep following the OS while the setting says to.
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const onSystem = () => {
      const current = localStorage.getItem(KEY) as ThemeChoice | null;
      if (current === "system") apply(systemTheme());
    };
    media?.addEventListener?.("change", onSystem);
    return () => media?.removeEventListener?.("change", onSystem);
  }, [apply]);

  const setChoice = useCallback(
    (next: ThemeChoice) => {
      setChoiceState(next);
      localStorage.setItem(KEY, next);
      apply(next === "system" ? systemTheme() : next);
    },
    [apply],
  );

  return (
    <ThemeContext.Provider value={{ theme, choice, setChoice }}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
