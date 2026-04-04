"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useOxarProgram } from "./use-oxar-program";
import { deriveVaultPda } from "@/lib/pda";
import { VaultAccount } from "./use-vaults";

export function useVault(region: string, denomination: string, assetSubtype: string) {
  const { program } = useOxarProgram();
  const [vault, setVault] = useState<VaultAccount | null>(null);
  const [vaultPda, setVaultPda] = useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVault = useCallback(async () => {
    if (!region || !denomination || !assetSubtype) {
      setVault(null);
      setLoading(false);
      return;
    }

    // Always derive and set the PDA even without a program
    const [pda] = deriveVaultPda(region, denomination, assetSubtype);
    setVaultPda(pda);

    if (!program) {
      setVault(null);
      setError("Wallet not connected");
      setLoading(false);
      return;
    }

    try {
      const account = await program.account.vault.fetch(pda);
      setVault({ publicKey: pda, account: account as any });
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch vault:", err);
      setError(err.message || "Failed to fetch vault");
    } finally {
      setLoading(false);
    }
  }, [program, region, denomination, assetSubtype]);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  return { vault, vaultPda, loading, error, refetch: fetchVault };
}
