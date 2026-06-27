"use client";

import { useEffect, useState } from "react";

import { getProviderTvl } from "@/lib/yield";

/** USD deposited (TVL) for a pool — a social-proof trust signal. null = unknown. */
export function useProviderTvl(poolId: string | undefined): number | null {
  const [tvl, setTvl] = useState<number | null>(null);

  useEffect(() => {
    if (!poolId) {
      setTvl(null);
      return;
    }
    let cancelled = false;
    getProviderTvl(poolId).then((v) => {
      if (!cancelled) setTvl(v > 0 ? v : null);
    });
    return () => {
      cancelled = true;
    };
  }, [poolId]);

  return tvl;
}
