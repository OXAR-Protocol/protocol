"use client";

import { Monitor, Moon, Sun } from "lucide-react";

import { useTheme, type ThemeChoice } from "@/context/theme-context";
import { useT } from "@/lib/i18n";

const OPTIONS: { value: ThemeChoice; icon: typeof Sun; key: "settings.light" | "settings.dark" | "settings.system" }[] = [
  { value: "light", icon: Sun, key: "settings.light" },
  { value: "dark", icon: Moon, key: "settings.dark" },
  { value: "system", icon: Monitor, key: "settings.system" },
];

/**
 * Light, dark, or whatever the phone is doing.
 *
 * Three options rather than a switch, because "follow the system" is a real answer
 * and the commonest one — a phone that turns dark at sunset should take the app
 * with it, and a two-state toggle can only freeze one of the two.
 */
export function ThemePicker() {
  const { t } = useT();
  const { choice, setChoice } = useTheme();

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {OPTIONS.map(({ value, icon: Icon, key }) => {
        const active = choice === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setChoice(value)}
            aria-pressed={active}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full border py-2 text-[12px] lowercase tracking-wide transition ${
              active
                ? "border-ink/40 bg-ink/[0.06] text-ink"
                : "border-ink/12 text-ink/50 hover:border-ink/30 hover:text-ink"
            }`}
          >
            <Icon size={13} strokeWidth={1.6} />
            {t(key)}
          </button>
        );
      })}
    </div>
  );
}
