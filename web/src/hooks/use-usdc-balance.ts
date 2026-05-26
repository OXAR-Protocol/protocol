"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";

import { CURRENT_USDC_MINT } from "@/lib/constants";

import { useOxarProgram } from "./use-oxar-program";

export function useUsdcBalance() {
  const { connection, walletAddress } = useOxarProgram();
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
      const usdcMint = new PublicKey(CURRENT_USDC_MINT);
      const ata = await getAssociatedTokenAddress(usdcMint, walletAddress);
      const account = await getAccount(connection, ata);
      // USDC has 6 decimals
      setBalance(Number(account.amount) / 1_000_000);
    } catch (_err) {
      // Account doesn't exist → balance is 0
      setBalance(0);
    } finally {
      setLoading(false);
    }
  }, [connection, walletAddress]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, refetch: fetchBalance };
}
