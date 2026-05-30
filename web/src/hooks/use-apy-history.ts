"use client";

import { useEffect, useState } from "react";

import { getApyHistory } from "@/lib/yield";

/** Last `count` daily APY values for a pool (for a sparkline). [] if no pool. */
export function useApyHistory(poolId: string | undefined, count = 60): number[] {
  const [values, setValues] = useState<number[]>([]);

  useEffect(() => {
    if (!poolId) {
      setValues([]);
      return;
    }
    let cancelled = false;
    getApyHistory(poolId).then((history) => {
      if (!cancelled) setValues(history.slice(-count).map((p) => p.apy));
    });
    return () => {
      cancelled = true;
    };
  }, [poolId, count]);

  return values;
}
