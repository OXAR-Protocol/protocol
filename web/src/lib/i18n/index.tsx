"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { en, type TranslationKey } from "./en";
import { uk } from "./uk";
import { ru } from "./ru";

export type Locale = "en" | "uk" | "ru";
export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "uk", label: "Українська" },
  { value: "ru", label: "Русский" },
];

const DICTS: Record<Locale, Partial<Record<TranslationKey, string>>> = { en, uk, ru };
const STORAGE_KEY = "oxar:locale";

interface I18n {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a key; `{var}` placeholders replaced from `vars`. Falls back to EN. */
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n>({
  locale: "en",
  setLocale: () => {},
  t: (key) => en[key] ?? key,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Restore the saved choice (client-only; EN renders first paint, then swaps).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "uk" || saved === "ru" || saved === "en") setLocaleState(saved);
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let s: string = DICTS[locale][key] ?? en[key] ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
      return s;
    },
    [locale],
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

/** Core-flow translations. `t("home.wakeUp")`, `t("home.sources.many", { n: 3 })`. */
export function useT(): I18n {
  return useContext(I18nContext);
}
