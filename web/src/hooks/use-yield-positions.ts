"use client";

import { useCallback, useEffect, useState } from "react";
import type { Connection, PublicKey } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { PROVIDERS, fromBaseUnits } from "@/lib/yield";
import { getCached, setCache } from "@/lib/cache";

export interface ProviderView {
  id: string;
  name: string;
  assetSymbol: string;
  /** Underlying asset mint (base58) — for per-token wallet balance lookups. */
  assetMint: string;
  decimals: number;
  description: string;
  riskLevel: "low" | "medium" | "high";
  chain: "solana" | "ethereum";
  /** Optional group id — providers sharing it collapse into one marketplace card. */
  group?: string;
  /** DefiLlama pool id — for the APY history sparkline. */
  defiLlamaPoolId?: string;
  /** Swap-and-hold acquired asset (Ondo/stocks) — for the swap-spread preview. */
  heldMint?: string;
  heldDecimals?: number;
  /** Supply APY as a fraction (0.06 = 6%). */
  apy: number;
  /** User's principal + accrued yield, in asset base units. 0 if not connected. */
  underlyingBalance: bigint;
  shares: bigint;
}

interface Snapshot {
  views: ProviderView[];
  totalValue: number;
}

const ZERO_POSITION = { underlyingBalance: BigInt(0), shares: BigInt(0) };
const cacheKey = (wallet: string) => `yield-positions:${wallet}`;

// In-flight requests per wallet — so the several components that read positions
// (home aggregate, pile, yield) and every tab navigation SHARE one fan-out instead
// of each firing RPC across all providers (which tripped Helius 429s). The result
// is also cached (lib/cache, 30s) so re-mounts within the window don't refetch.
const inflight = new Map<string, Promise<Snapshot>>();

async function fetchSnapshot(
  connection: Connection,
  walletAddress: PublicKey | null,
): Promise<Snapshot> {
  const views = await Promise.all(
    PROVIDERS.map(async (p): Promise<ProviderView> => {
      const [apy, position] = await Promise.all([
        p.getApy(connection).catch(() => 0),
        walletAddress
          ? p.getPosition(walletAddress, connection).catch(() => ZERO_POSITION)
          : Promise.resolve(ZERO_POSITION),
      ]);
      return {
        id: p.id,
        name: p.name,
        assetSymbol: p.assetSymbol,
        assetMint: p.asset.toBase58(),
        decimals: p.decimals,
        description: p.description,
        riskLevel: p.riskLevel,
        chain: p.chain,
        group: p.group,
        defiLlamaPoolId: p.defiLlamaPoolId,
        heldMint: p.heldMint,
        heldDecimals: p.heldDecimals,
        apy,
        underlyingBalance: position.underlyingBalance,
        shares: position.shares,
      };
    }),
  );
  // Normalized USD total — sum per-provider human amounts so mixed decimals /
  // assets stay correct (raw base-unit sums only hold while every source is USDC).
  const totalValue = views.reduce(
    (acc, v) => acc + fromBaseUnits(v.underlyingBalance, v.decimals),
    0,
  );
  return { views, totalValue };
}

/**
 * Cached + in-flight-deduped snapshot load. `force` (a post-deposit/withdraw
 * refresh) bypasses the cache and the shared in-flight request to fetch fresh.
 */
async function loadSnapshot(
  connection: Connection,
  walletAddress: PublicKey | null,
  force: boolean,
): Promise<Snapshot> {
  const key = walletAddress?.toBase58() ?? "anon";
  if (!force) {
    const cached = getCached<Snapshot>(cacheKey(key));
    if (cached) return cached;
    const pending = inflight.get(key);
    if (pending) return pending;
  }
  const promise = fetchSnapshot(connection, walletAddress)
    .then((snap) => {
      setCache(cacheKey(key), snap);
      return snap;
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

/**
 * Reads APY for every provider, plus the connected wallet's position in each.
 * Fetch-on-mount (no polling, per web conventions); `refresh()` after actions.
 * Reads are shared/cached across components + navigations to avoid RPC 429s.
 */
export function useYieldPositions() {
  const { connection, walletAddress } = useSolanaContext();
  const initialKey = walletAddress?.toBase58() ?? "anon";
  const [snap, setSnap] = useState<Snapshot>(
    () => getCached<Snapshot>(cacheKey(initialKey)) ?? { views: [], totalValue: 0 },
  );
  const [loading, setLoading] = useState<boolean>(
    () => getCached<Snapshot>(cacheKey(initialKey)) === null,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      setLoading(true);
      setError(null);
      try {
        setSnap(await loadSnapshot(connection, walletAddress, force));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [connection, walletAddress],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return { views: snap.views, totalValue: snap.totalValue, loading, error, refresh };
}
