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

const SIZES: Record<Variant, string> = {
  hero: "text-[clamp(2.5rem,6vw,4rem)] font-light",
  lg: "text-4xl font-light",
  md: "text-xl",
  sm: "text-base",
};

/**
 * A clean dollar balance. It still ticks up live under the hood (so larger
 * balances visibly move over time), but it always renders as a plain, grouped
 * two-decimal amount — `$1,234.56` — with no dim sub-cent digits. The projected
 * earnings rate is shown separately (see the home hero), which stays legible even
 * for tiny positions where two decimals look frozen.
 */
export function LiveAmount({ value, apy, variant = "md", className }: Props) {
  const live = useLiveValue(value, apy);
  const safe = Math.max(value > 0 ? live : value, 0);
  const text = safe.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <span className={`tabular-nums text-black leading-none tracking-[-0.02em] ${SIZES[variant]} ${className ?? ""}`}>
      ${text}
    </span>
  );
}
