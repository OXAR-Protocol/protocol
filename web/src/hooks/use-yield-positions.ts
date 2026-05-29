"use client";

import { useCallback, useEffect, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { PROVIDERS } from "@/lib/yield";

export interface ProviderView {
  id: string;
  name: string;
  assetSymbol: string;
  decimals: number;
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
            decimals: p.decimals,
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

  /** Sum of underlying balances across providers (asset base units). */
  const totalBalance = views.reduce((acc, v) => acc + v.underlyingBalance, BigInt(0));

  return { views, totalBalance, loading, error, refresh: load };
}
