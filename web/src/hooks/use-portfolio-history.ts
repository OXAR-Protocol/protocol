"use client";

import { useEffect, useState } from "react";

import type { PerformanceDay, RangePerformance } from "@oxar/sdk";

import { useSolanaContext } from "@/providers/solana-provider";
import { getCached, setCache } from "@/lib/cache";

interface History {
  /** Oldest first. Each day carries its value AND what produced it. */
  days: PerformanceDay[];
  /** Earned, return, and flows over exactly the days above — computed in the same
   *  pass, so the figures under the chart cannot describe a different period. */
  performance: RangePerformance | null;
  loading: boolean;
}

const EMPTY: Omit<History, "loading"> = { days: [], performance: null };

/**
 * The portfolio over the last `days`, reconstructed server-side from on-chain
 * balances + transfers + daily prices (`/api/portfolio-history`). Fetch-on-mount,
 * cached — the reconstruction is the same work until a new transaction lands.
 */
export function usePortfolioHistory(days = 90): History {
  const { walletAddress } = useSolanaContext();
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const owner = walletAddress?.toBase58();
    if (!owner) {
      setData(EMPTY);
      setLoading(false);
      return;
    }
    const key = `portfolio-history:v2:${owner}:${days}`;
    const cached = getCached<typeof EMPTY>(key);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/portfolio-history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner, days }),
    })
      .then((r) => r.json())
      .then((j: { days?: PerformanceDay[]; performance?: RangePerformance }) => {
        const next = {
          days: Array.isArray(j?.days) ? j.days : [],
          performance: j?.performance ?? null,
        };
        if (!cancelled) {
          setData(next);
          setCache(key, next);
        }
      })
      .catch(() => {
        if (!cancelled) setData(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress, days]);

  return { ...data, loading };
}
