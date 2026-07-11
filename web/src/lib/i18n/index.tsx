"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { en, type TranslationKey } from "./en";
import { uk } from "./uk";

export type Locale = "en" | "uk";
export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "uk", label: "Українська" },
];

const DICTS: Record<Locale, Partial<Record<TranslationKey, string>>> = { en, uk };
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
  // A previously-saved "ru" (removed locale) falls through to the EN default.
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "uk" || saved === "en") setLocaleState(saved);
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

// Thrown user-facing error messages are English constants (lib code can't call
// hooks). Map the known ones to keys at display time; unknown text passes through.
const ERROR_KEYS: Record<string, TranslationKey> = {
  "Price impact too high — try a smaller amount": "err.priceImpact",
  "Nothing to withdraw": "err.nothingToWithdraw",
  "Price unavailable — try again": "err.priceUnavailable",
  "Amount too small to withdraw": "err.amountTooSmall",
  "Wallet not connected": "err.walletNotConnected",
  "That's too small after the gas reserve — try a bit more.": "err.tooSmallAfterGas",
  "We didn't see your funds arrive yet — card top-ups can take a few minutes. Once your SOL lands you can buy straight from your wallet balance.":
    "err.fundsNotArrived",
  "Couldn't price SOL — try again": "err.solPrice",
  "Cancelled — nothing left your wallet.": "err.cancelled",
  "That took too long and expired before it was sent. Please try again.": "err.expired",
  "Not enough balance — check you have enough USDC, plus a little SOL for the network fee.":
    "err.insufficient",
  "Connect your wallet to continue.": "err.connectWallet",
  "Network's being slow right now. Please try again in a moment.": "err.networkSlow",
  "The price moved while we were sending it. Please try again.": "err.slippage",
  "That transaction would fail on-chain. Try a larger amount or a different asset.": "err.wouldFail",
  "Switch your wallet to the right network and try again.": "err.wrongNetwork",
  "This didn't go through — most often that's not enough balance for the amount plus the network fee. Please check and try again.":
    "err.txFailed",
  "Something went wrong. Please try again.": "err.generic",
};

/** Localize a user-facing error message if we recognise it; else return as-is. */
export function localizeError(msg: string | null, t: I18n["t"]): string | null {
  if (!msg) return msg;
  const key = ERROR_KEYS[msg];
  return key ? t(key) : msg;
}
