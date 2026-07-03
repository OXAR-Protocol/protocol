"use client";

import { useT, LOCALES } from "@/lib/i18n";

/** Locale switcher chips (EN / UK / RU) for the settings page. */
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
