"use client";

import { useEffect, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { fromBaseUnits } from "@/lib/yield";
import { getCached, setCache } from "@/lib/cache";
import { useYieldPositions } from "./use-yield-positions";

export interface SourceEarning {
  id: string;
  name: string;
  /** Current position value, USD. */
  currentValue: number;
  /** Net invested (on-chain cost basis), USD. */
  invested: number;
  /** currentValue − invested, USD. */
  earned: number;
  apy: number;
}

const cacheKey = (owner: string) => `earnings-basis:${owner}`;

/**
 * Realized + unrealized earnings per source, from ON-CHAIN cost basis (the
 * `/api/earnings` Helius-history engine), combined with the live position value:
 *   earned = currentValue − netInvested.
 * Only sources the engine can attribute appear here; `allCovered` says whether
 * every active position is covered (so a total is trustworthy).
 */
export function useEarnings() {
  const { walletAddress } = useSolanaContext();
  const { views, totalValue, loading: posLoading } = useYieldPositions();
  const [basis, setBasis] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const owner = walletAddress?.toBase58();
    if (!owner) {
      setBasis(null);
      setLoading(false);
      return;
    }
    const cached = getCached<Record<string, number>>(cacheKey(owner));
    if (cached) {
      setBasis(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/earnings", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ owner }),
        });
        const json = (await res.json()) as { basis?: Record<string, number> };
        const b = json?.basis ?? {};
        if (!cancelled) {
          setBasis(b);
          setCache(cacheKey(owner), b);
        }
      } catch {
        if (!cancelled) setBasis({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  const active = views.filter((v) => fromBaseUnits(v.underlyingBalance, v.decimals) > 0);
  const sources: SourceEarning[] = [];
  let totalEarned = 0;
  let totalInvested = 0;
  let supportedValue = 0;
  let weightedApy = 0;

  for (const v of active) {
    if (!basis || !(v.id in basis)) continue;
    const currentValue = fromBaseUnits(v.underlyingBalance, v.decimals);
    const invested = basis[v.id];
    const earned = currentValue - invested;
    sources.push({ id: v.id, name: v.name, currentValue, invested, earned, apy: v.apy });
    totalEarned += earned;
    totalInvested += invested;
    supportedValue += currentValue;
    weightedApy += currentValue * v.apy;
  }

  const blendedApy = supportedValue > 0 ? weightedApy / supportedValue : 0;
  const allCovered = active.length > 0 && sources.length === active.length;

  return {
    sources,
    totalEarned,
    totalInvested,
    supportedValue,
    blendedApy,
    allCovered,
    totalValue,
    loading: posLoading || loading,
  };
}
