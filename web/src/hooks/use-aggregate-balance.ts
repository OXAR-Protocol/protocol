"use client";

import { fromBaseUnits } from "@/lib/yield";
import { useYieldPositions } from "./use-yield-positions";

/**
 * Aggregate balance across all live yield providers (Jupiter Lend, …).
 * Sums each position's underlying balance into a single USD figure and
 * estimates daily yield from each source's live APY.
 */
export function useAggregatePersonalBalance() {
  const { views, loading, refresh } = useYieldPositions();

  let totalUsdc = 0;
  let dailyYield = 0;
  let positionCount = 0;

  for (const v of views) {
    const value = fromBaseUnits(v.underlyingBalance, v.decimals);
    if (value > 0) {
      totalUsdc += value;
      dailyYield += (value * v.apy) / 365;
      positionCount += 1;
    }
  }

  return {
    totalUsdc,
    dailyYield,
    positionCount,
    views,
    loading,
    refetch: refresh,
  };
}
