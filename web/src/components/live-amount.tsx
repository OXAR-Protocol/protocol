"use client";

import { useLiveValue } from "@/hooks/use-live-value";

type Variant = "hero" | "lg" | "md" | "sm";

interface Props {
  /** Snapshot value in USD (principal + accrued). */
  value: number;
  /** Supply APY as a fraction (0.06 = 6%) — drives the live tick. */
  apy: number;
  variant?: Variant;
  className?: string;
}

// main = the prominent "$12.34"; micro = the dim sub-cent digits that tick live.
const SIZES: Record<Variant, { main: string; micro: string }> = {
  hero: { main: "text-[clamp(2.5rem,6vw,4rem)] font-light", micro: "text-[clamp(0.9rem,2.2vw,1.4rem)]" },
  lg: { main: "text-4xl font-light", micro: "text-lg" },
  md: { main: "text-xl", micro: "text-xs" },
  sm: { main: "text-base", micro: "text-[0.65em]" },
};

const MICRO_DIGITS = 6; // sub-cent precision — last digit visibly moves even on small balances

/**
 * A balance that ticks up live. Shows "$INT.cc" prominently with the next few
 * sub-cent digits dimmed and animating, so tiny positions visibly grow in
 * real time instead of looking frozen at two decimals.
 */
export function LiveAmount({ value, apy, variant = "md", className }: Props) {
  const live = useLiveValue(value, apy);
  const { main, micro } = SIZES[variant];
  const safe = live > 0 ? live : 0;

  // Static (no growth) → plain two-decimal amount, no dangling zeros.
  if (value <= 0 || apy <= 0) {
    return (
      <span className={`font-sans tabular-nums text-white ${main} ${className ?? ""}`}>
        ${safe.toFixed(2)}
      </span>
    );
  }

  const fixed = safe.toFixed(2 + MICRO_DIGITS); // "12.34567890"
  const [intPart, dec] = fixed.split(".");
  const cents = dec.slice(0, 2);
  const microDigits = dec.slice(2);
  const grouped = Number(intPart).toLocaleString("en-US");

  return (
    <span className={`font-sans tabular-nums text-white leading-none ${main} ${className ?? ""}`}>
      ${grouped}.{cents}
      <span className={`text-accent/60 ${micro}`}>{microDigits}</span>
    </span>
  );
}
