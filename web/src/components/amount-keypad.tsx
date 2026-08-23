"use client";

import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "back"] as const;

/**
 * The number pad money is typed on.
 *
 * A phone's own keyboard covers half the screen and puts a decimal point next to
 * an emoji key; the amount is the only thing on this screen, so it gets the screen.
 * Shared by every place a sum is entered — topping up, buying, selling — because
 * three keypads would drift into three ideas of what "max" and "." mean.
 */
export function AmountKeypad({
  value,
  onChange,
  /** Guard against a second dot and a leading run of zeros. */
  maxDecimals = 2,
}: {
  value: string;
  onChange: (next: string) => void;
  maxDecimals?: number;
}) {
  const press = (key: (typeof KEYS)[number]) => {
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === ".") {
      if (value.includes(".")) return;
      onChange((value === "" ? "0" : value) + ".");
      return;
    }
    const [, decimals] = value.split(".");
    if (decimals !== undefined && decimals.length >= maxDecimals) return;
    // "0" alone then a digit reads as "05" — replace instead of appending.
    onChange(value === "0" ? key : value + key);
  };

  return (
    <div className="grid grid-cols-3 gap-1">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => press(key)}
          aria-label={key === "back" ? "delete" : key}
          className="flex h-14 items-center justify-center rounded-control text-[22px] text-ink transition hover:bg-ink/[0.04] active:bg-ink/[0.08]"
        >
          {key === "back" ? <Delete size={20} strokeWidth={1.5} /> : key}
        </button>
      ))}
    </div>
  );
}
