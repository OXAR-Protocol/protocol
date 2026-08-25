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
  /** Mints the wallet still holds — the breakdown marks the rest as closed. */
  heldMints: string[];
  loading: boolean;
  /** The answer did not arrive, or arrived built on less history than the wallet
   *  has. Either way what is here is not the truth, and a screen that draws it
   *  anyway is telling the user something false with total confidence. */
  unavailable: boolean;
}

type Data = Pick<History, "days" | "performance" | "heldMints">;

const EMPTY: Data = { days: [], performance: null, heldMints: [] };

/**
 * The portfolio over the last `days`, reconstructed server-side from on-chain
 * balances + transfers + daily prices (`/api/portfolio-history`). Fetch-on-mount,
 * cached — the reconstruction is the same work until a new transaction lands.
 */
export function usePortfolioHistory(days = 90): History {
  const { walletAddress } = useSolanaContext();
  const [data, setData] = useState<Data>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const owner = walletAddress?.toBase58();
    if (!owner) {
      setData(EMPTY);
      setUnavailable(false);
      setLoading(false);
      return;
    }
    const key = `portfolio-history:v2:${owner}:${days}`;
    const cached = getCached<Data>(key);
    if (cached) {
      setData(cached);
      setUnavailable(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUnavailable(false);
    fetch("/api/portfolio-history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ owner, days }),
    })
      // `r.json()` on its own is why a broken chart looked like an empty one: a 502
      // carries a perfectly valid JSON body, so the parse succeeded, `days` came out
      // undefined, and the page rendered "you have no history" from a server error.
      .then(async (r) => ({ ok: r.ok, json: await r.json() }))
      .then(({ ok, json: j }: { ok: boolean; json: { days?: PerformanceDay[]; performance?: RangePerformance; heldMints?: string[]; incomplete?: boolean } }) => {
        if (cancelled) return;
        if (!ok || j?.incomplete || !Array.isArray(j?.days)) {
          // Incomplete is not empty. A truncated read reconstructs a flat line at
          // today's balance, which is exactly the "30 days shows no movement" that
          // got reported — plausible, confident and wrong.
          setData(EMPTY);
          setUnavailable(true);
          return;
        }
        const next = {
          days: j.days,
          performance: j?.performance ?? null,
          heldMints: Array.isArray(j?.heldMints) ? j.heldMints : [],
        };
        setData(next);
        // Only a whole answer is worth remembering.
        setCache(key, next);
      })
      .catch(() => {
        if (!cancelled) {
          setData(EMPTY);
          setUnavailable(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [walletAddress, days]);

  return { ...data, loading, unavailable };
}
