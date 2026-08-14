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
              ? "bg-ink text-paper"
              : "bg-ink/[0.05] text-ink/45 hover:text-ink"
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
              ? "border-[var(--brand)] bg-[var(--brand)]/[0.05] text-ink"
              : "border-ink/10 text-ink/60 hover:border-ink/30 hover:text-ink"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
