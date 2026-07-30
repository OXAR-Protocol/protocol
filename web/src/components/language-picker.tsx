"use client";

import { useT, LOCALES } from "@/lib/i18n";

/**
 * Tiny EN / UK toggle for the pre-entry screens (terms gate, first-run
 * welcome) — the same choice the settings page offers, shrunk to fit a modal
 * header. Deliberately NOT shown during the tour itself: the tour follows
 * whatever was chosen before it started.
 */
export function LanguageChips() {
  const { locale, setLocale } = useT();
  return (
    <div className="flex gap-1">
      {LOCALES.map((l) => (
        <button
          key={l.value}
          type="button"
          onClick={() => setLocale(l.value)}
          aria-label={l.label}
          className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide transition ${
            locale === l.value
              ? "bg-black text-white"
              : "bg-black/[0.05] text-black/45 hover:text-black"
          }`}
        >
          {l.value}
        </button>
      ))}
    </div>
  );
}

/** Locale switcher chips (EN / UK) for the settings page. */
export function LanguagePicker() {
  const { locale, setLocale } = useT();
  return (
    <div className="flex flex-wrap gap-2">
      {LOCALES.map((l) => (
        <button
          key={l.value}
          onClick={() => setLocale(l.value)}
          className={`px-4 py-2 rounded-full border text-[13px] transition ${
            locale === l.value
              ? "border-[#3c05c7] bg-[#3c05c7]/[0.05] text-black"
              : "border-black/10 text-black/60 hover:border-black/30 hover:text-black"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
