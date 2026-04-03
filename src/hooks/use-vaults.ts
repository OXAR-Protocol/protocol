"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useOxarProgram } from "./use-oxar-program";

export interface VaultAccount {
  publicKey: PublicKey;
  account: {
    protocolVersion: number;
    authority: PublicKey;
    usdcMint: PublicKey;
    vaultTokenMint: PublicKey;
    usdcPool: PublicKey;
    treasury: PublicKey;
    assetClass: string;
    region: string;
    denomination: string;
    assetSubtype: string;
    apyBps: BN;
    navPerShare: BN;
    totalDeposits: BN;
    totalShares: BN;
    lastUpdateTs: BN;
    maturityTs: BN;
    isActive: boolean;
    feeBps: number;
    bump: number;
  };
}

export function useVaults() {
  const { program } = useOxarProgram();
  const [vaults, setVaults] = useState<VaultAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVaults = useCallback(async () => {
    if (!program) {
      setVaults([]);
      setLoading(false);
      return;
    }

    try {
      const allVaults = await program.account.vault.all();
      setVaults(allVaults as unknown as VaultAccount[]);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch vaults:", err);
      setError(err.message || "Failed to fetch vaults");
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchVaults();
    const interval = setInterval(fetchVaults, 10000);
    return () => clearInterval(interval);
  }, [fetchVaults]);

  return { vaults, loading, error, refetch: fetchVaults };
}
