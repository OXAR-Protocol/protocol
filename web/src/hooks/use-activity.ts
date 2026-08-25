"use client";

import { useEffect, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { getCached, setCache } from "@/lib/cache";
import type { ActivityEvent } from "@/lib/activity/parse";

const cacheKey = (owner: string, limit: number) => `activity:${owner}:${limit}`;

/**
 * On-chain activity for the connected wallet (via `/api/activity`, which reads
 * Helius history server-side). Fetch-on-mount, cached — no polling.
 *
 * `limit` is how deep to read: the feed wants the latest handful, the history view
 * wants everything. It's part of the cache key, so a shallow read can't satisfy a
 * request for the full history.
 */
export function useActivity(limit?: number) {
  const { walletAddress } = useSolanaContext();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  /** The read failed. An empty feed and a feed we could not fetch look identical
   *  from here, and only one of them means "you have done nothing". */
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const owner = walletAddress?.toBase58();
    if (!owner) {
      setEvents([]);
      setUnavailable(false);
      setLoading(false);
      return;
    }
    const cached = getCached<ActivityEvent[]>(cacheKey(owner, limit ?? 0));
    if (cached) {
      setEvents(cached);
      setUnavailable(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setUnavailable(false);
    (async () => {
      try {
        const res = await fetch("/api/activity", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(limit ? { owner, limit } : { owner }),
        });
        const json = (await res.json()) as { events?: ActivityEvent[] };
        if (cancelled) return;
        // A 502 parses perfectly well and yields no events, which is why a failed
        // read used to render as "no transactions yet".
        if (!res.ok || !Array.isArray(json?.events)) {
          setEvents([]);
          setUnavailable(true);
          return;
        }
        setEvents(json.events);
        setCache(cacheKey(owner, limit ?? 0), json.events);
      } catch {
        if (!cancelled) {
          setEvents([]);
          setUnavailable(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [walletAddress, limit]);

  return { events, loading, unavailable };
}
