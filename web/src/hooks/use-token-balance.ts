"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

import { useSolanaContext } from "@/providers/solana-provider";

/** Wallet balance of any SPL token (human units). 0 if the ATA doesn't exist. */
export function useTokenBalance(mint: string, decimals: number) {
  const { connection, walletAddress } = useSolanaContext();
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!walletAddress) {
      setBalance(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const ata = await getAssociatedTokenAddress(new PublicKey(mint), walletAddress);
      const account = await getAccount(connection, ata);
      setBalance(Number(account.amount) / 10 ** decimals);
    } catch {
      // Account doesn't exist → balance is 0.
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connection, walletAddress, mint, decimals]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
