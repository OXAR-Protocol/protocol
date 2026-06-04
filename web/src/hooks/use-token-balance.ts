"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey, type Connection } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

import { useSolanaContext } from "@/providers/solana-provider";
import { getCached, setCache } from "@/lib/cache";

const cacheKey = (mint: string, wallet: string) => `token-balance:${mint}:${wallet}`;

// Shared in-flight reads per (mint, wallet) so the same balance isn't fetched once
// per component/navigation — paired with the lib/cache 30s TTL to cut RPC 429s.
const inflight = new Map<string, Promise<number>>();

async function loadBalance(
  connection: Connection,
  walletAddress: PublicKey,
  mint: string,
  decimals: number,
  force: boolean,
): Promise<number> {
  const key = cacheKey(mint, walletAddress.toBase58());
  if (!force) {
    const cached = getCached<number>(key);
    if (cached !== null) return cached;
    const pending = inflight.get(key);
    if (pending) return pending;
  }
  const promise = (async () => {
    try {
      const ata = await getAssociatedTokenAddress(new PublicKey(mint), walletAddress);
      const account = await getAccount(connection, ata);
      return Number(account.amount) / 10 ** decimals;
    } catch {
      // Account doesn't exist → balance is 0.
      return 0;
    }
  })()
    .then((v) => {
      setCache(key, v);
      return v;
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

/** Wallet balance of any SPL token (human units). 0 if the ATA doesn't exist.
 *  Cached + in-flight-deduped per (mint, wallet); `refetch()` forces a fresh read. */
export function useTokenBalance(mint: string, decimals: number) {
  const { connection, walletAddress } = useSolanaContext();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(
    async (force = false) => {
      if (!walletAddress) {
        setBalance(0);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        setBalance(await loadBalance(connection, walletAddress, mint, decimals, force));
      } finally {
        setLoading(false);
      }
    },
    [connection, walletAddress, mint, decimals],
  );

  useEffect(() => {
    void fetchBalance(false);
  }, [fetchBalance]);

  return { balance, loading, refetch: () => fetchBalance(true) };
}
