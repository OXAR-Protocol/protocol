"use client";

import { useCallback, useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useOxarProgram } from "./use-oxar-program";

export function useSolBalance() {
  const { walletAddress, connection } = useOxarProgram();
  const [balance, setBalance] = useState<number>(0);

  const refetch = useCallback(async () => {
    if (!walletAddress || !connection) return;
    try {
      const lamports = await connection.getBalance(walletAddress);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      // ignore transient RPC failures
    }
  }, [walletAddress, connection]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { balance, refetch };
}
