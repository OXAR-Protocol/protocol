"use client";

import { useEffect, useState } from "react";

import type { PortfolioPoint } from "@oxar/sdk";

import { useSolanaContext } from "@/providers/solana-provider";
import { getCached, setCache } from "@/lib/cache";

/**
 * Portfolio value over the last `days`, reconstructed server-side from on-chain
 * history + daily prices (`/api/portfolio-history`). Fetch-on-mount, cached — the
 * reconstruction is the same work until a new transaction lands.
 */
export function usePortfolioHistory(days = 90) {
  const { walletAddress } = useSolanaContext();
  const [points, setPoints] = useState<PortfolioPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const owner = walletAddress?.toBase58();
    if (!owner) {
      setPoints([]);
      setLoading(false);
      return;
    }
    const key = `portfolio-history:${owner}:${days}`;
    const cached = getCached<PortfolioPoint[]>(key);
    if (cached) {
      setPoints(cached);
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
      .then((j: { points?: PortfolioPoint[] }) => {
        const list = Array.isArray(j?.points) ? j.points : [];
        if (!cancelled) {
          setPoints(list);
          setCache(key, list);
        }
      })
      .catch(() => {
        if (!cancelled) setPoints([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress, days]);

  return { points, loading };
}
