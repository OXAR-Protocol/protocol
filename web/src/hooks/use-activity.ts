"use client";

import { useEffect, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { getCached, setCache } from "@/lib/cache";
import type { ActivityEvent } from "@/lib/activity/parse";

const cacheKey = (owner: string) => `activity:${owner}`;

/**
 * Recent on-chain activity for the connected wallet (via `/api/activity`, which
 * reads Helius history server-side). Fetch-on-mount, cached — no polling.
 */
export function useActivity() {
  const { walletAddress } = useSolanaContext();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const owner = walletAddress?.toBase58();
    if (!owner) {
      setEvents([]);
      setLoading(false);
      return;
    }
    const cached = getCached<ActivityEvent[]>(cacheKey(owner));
    if (cached) {
      setEvents(cached);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await fetch("/api/activity", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ owner }),
        });
        const json = (await res.json()) as { events?: ActivityEvent[] };
        const e = json?.events ?? [];
        if (!cancelled) {
          setEvents(e);
          setCache(cacheKey(owner), e);
        }
      } catch {
        if (!cancelled) setEvents([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  return { events, loading };
}
