"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { fromBaseUnits } from "@/lib/yield";
import { getCached, setCache } from "@/lib/cache";
import {
  basisVersion,
  effectiveBasis,
  hasIndexedBasis,
  setIndexedBasis,
  subscribeBasis,
} from "@/lib/earnings/pending-basis";
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

/** Wallets whose basis request failed. An empty basis and a basis we could not fetch
 *  produce the same empty list of sources, and only one of them means "nothing here
 *  to attribute" — the other means "we do not know yet, and must not imply zero". */
const failedFor = new Set<string>();

/**
 * Realized + unrealized earnings per source, from ON-CHAIN cost basis (the
 * `/api/earnings` Helius-history engine), combined with the live position value:
 *   earned = currentValue − netInvested.
 * Only sources the engine can attribute appear here; `allCovered` says whether
 * every active position is covered (so a total is trustworthy).
 *
 * The indexed basis lags a fresh deposit (response cache + indexing delay) while
 * the value does not, so it is read through the pending-delta store — otherwise a
 * top-up shows up as profit for minutes. See `lib/earnings/pending-basis`.
 */
/** One request per wallet even when several views mount together — the route pages
 *  25× through Helius, so a duplicate is expensive. */
const inflight = new Map<string, Promise<void>>();

function loadBasis(owner: string): Promise<void> {
  const running = inflight.get(owner);
  if (running) return running;
  const request = (async () => {
    try {
      const res = await fetch("/api/earnings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ owner }),
      });
      const json = (await res.json()) as { basis?: Record<string, number> };
      // A 502 parses fine and carries no basis; writing that as an empty map is how
      // "we could not load your profit" became "your profit is nothing".
      if (!res.ok || !json?.basis) {
        failedFor.add(owner);
        setIndexedBasis(owner, {});
        return;
      }
      failedFor.delete(owner);
      setIndexedBasis(owner, json.basis);
      setCache(cacheKey(owner), json.basis);
    } catch {
      failedFor.add(owner);
      setIndexedBasis(owner, {});
    } finally {
      inflight.delete(owner);
    }
  })();
  inflight.set(owner, request);
  return request;
}

export function useEarnings() {
  const { walletAddress } = useSolanaContext();
  const { views, totalValue, loading: posLoading } = useYieldPositions();
  // Re-render when a fetch lands or a deposit/withdraw records its delta.
  const version = useSyncExternalStore(subscribeBasis, basisVersion, () => 0);

  useEffect(() => {
    const owner = walletAddress?.toBase58();
    if (!owner) return;
    const cached = getCached<Record<string, number>>(cacheKey(owner));
    if (cached) setIndexedBasis(owner, cached);
    else void loadBasis(owner);
  }, [walletAddress]);

  const owner = walletAddress?.toBase58();
  // Owner-keyed, so a late response for a previous wallet can't be read as this one's.
  const basis = useMemo(
    () => (owner && hasIndexedBasis(owner) ? effectiveBasis(owner) : null),
    // `version` is the store's change signal — see useSyncExternalStore above.
    [owner, version],
  );
  const loading = posLoading || (!!owner && !basis);
  const unavailable = !!owner && failedFor.has(owner);

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
    loading,
    unavailable,
  };
}

/**
 * Per-source profit since it was bought, keyed by source id — what a list needs to
 * show which holding is in the red. A source the cost-basis engine can't cover is
 * simply absent rather than reported as zero.
 */
export function useEarnedById(): Record<string, number> {
  const { sources } = useEarnings();
  return useMemo(
    () => Object.fromEntries(sources.map((s) => [s.id, s.earned])),
    [sources],
  );
}

/** True when the cost-basis read failed, so a missing figure means "we could not
 *  work it out" rather than "this position has no profit to show". */
export function useEarningsUnavailable(): boolean {
  return useEarnings().unavailable;
}

/**
 * What you put in, by source id — the other half of `useEarnedById`.
 *
 * A position card that shows only what something is worth answers half a question:
 * worth compared to what? This is the "what", and dividing it by the units held
 * gives the price the position was built at.
 */
export function useInvestedById(): Record<string, number> {
  const { sources } = useEarnings();
  return useMemo(
    () => Object.fromEntries(sources.map((s) => [s.id, s.invested])),
    [sources],
  );
}
