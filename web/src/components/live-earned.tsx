"use client";

import { useLiveValue } from "@/hooks/use-live-value";

interface Props {
  /** Current position value, USD (snapshot — ticks live under the hood). */
  currentValue: number;
  /** Net invested (on-chain cost basis), USD. */
  invested: number;
  /** Blended APY (fraction) driving the live tick. */
  apy: number;
  /** Sub-cent precision so real accrual is visibly moving. */
  precision?: number;
  className?: string;
}

/**
 * Live realized + unrealized earnings = (live value) − invested. Ticks up in real
 * time at high precision so the actual profit is visible to the kopeck. This is a
 * REAL number (cost basis is read on-chain), not a projection.
 */
export function LiveEarned({ currentValue, invested, apy, precision = 6, className }: Props) {
  const live = useLiveValue(currentValue, apy);
  const earned = live - invested;
  const sign = earned < 0 ? "-" : "+";
  const text = Math.abs(earned).toFixed(precision);
  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {sign}${text}
    </span>
  );
}
