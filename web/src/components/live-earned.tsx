"use client";

import { formatSignedUsd } from "@oxar/sdk";

import { useLiveValue } from "@/hooks/use-live-value";

interface Props {
  /** Current position value, USD (snapshot — ticks live under the hood). */
  currentValue: number;
  /** Net invested (on-chain cost basis), USD. */
  invested: number;
  /** Blended APY (fraction) driving the live tick. */
  apy: number;
  /** Digits shown. Cents by default; the yield line asks for more so the live
   *  accrual is visibly moving. */
  precision?: number;
  className?: string;
}

/**
 * Live realized + unrealized earnings = (live value) − invested. Ticks up in real
 * time at high precision so the actual profit is visible to the kopeck. This is a
 * REAL number (cost basis is read on-chain), not a projection.
 */
export function LiveEarned({ currentValue, invested, apy, precision = 2, className }: Props) {
  const live = useLiveValue(currentValue, apy);
  return (
    <span className={`tabular-nums ${className ?? ""}`}>
      {formatSignedUsd(live - invested, precision)}
    </span>
  );
}
