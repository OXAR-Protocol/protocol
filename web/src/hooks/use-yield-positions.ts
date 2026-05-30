"use client";

import { useCallback, useEffect, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { PROVIDERS, fromBaseUnits } from "@/lib/yield";

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
  /** Supply APY as a fraction (0.06 = 6%). */
  apy: number;
  /** User's principal + accrued yield, in asset base units. 0 if not connected. */
  underlyingBalance: bigint;
  shares: bigint;
}

/**
 * Reads APY for every provider, plus the connected wallet's position in each.
 * Fetch-on-mount (no polling, per web conventions); `refresh()` after actions.
 */
export function useYieldPositions() {
  const { connection, walletAddress } = useSolanaContext();
  const [views, setViews] = useState<ProviderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await Promise.all(
        PROVIDERS.map(async (p): Promise<ProviderView> => {
          const [apy, position] = await Promise.all([
            p.getApy(connection).catch(() => 0),
            walletAddress
              ? p.getPosition(walletAddress, connection).catch(() => ({
                  underlyingBalance: BigInt(0),
                  shares: BigInt(0),
                }))
              : Promise.resolve({ underlyingBalance: BigInt(0), shares: BigInt(0) }),
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
            apy,
            underlyingBalance: position.underlyingBalance,
            shares: position.shares,
          };
        }),
      );
      setViews(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [connection, walletAddress]);

  useEffect(() => {
    void load();
  }, [load]);

  // Normalized USD total — sum per-provider human amounts so mixed decimals /
  // assets stay correct (raw base-unit sums only hold while every source is USDC).
  const totalValue = views.reduce(
    (acc, v) => acc + fromBaseUnits(v.underlyingBalance, v.decimals),
    0,
  );

  return { views, totalValue, loading, error, refresh: load };
}
