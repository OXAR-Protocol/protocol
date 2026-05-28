"use client";

import { useCallback, useEffect, useState } from "react";
import { BN } from "@coral-xyz/anchor";

import { derivePersonalVaultPda, vaultIdForYieldSource } from "@oxar/sdk";

import { useOxarProgram } from "./use-oxar-program";

export interface PersonalVaultState {
  exists: boolean;
  isActive: boolean;
  totalDeposits: BN;
  totalShares: BN;
  hotPoolBalance: BN;
  coldCapital: BN;
  navPerShare: BN;
  feeBps: number;
  vaultPda: string | null;
  loading: boolean;
  refetch: () => void;
}

/// Fetches a user's personal vault for a specific yield-source.
/// One vault per (user, yield-source). vault_id is derived deterministically
/// from the yield-source id, so the same address is always reused.
export function usePersonalVault(yieldSourceId: string): PersonalVaultState {
  const { program, walletAddress } = useOxarProgram();
  const [state, setState] = useState<Omit<PersonalVaultState, "refetch">>({
    exists: false,
    isActive: false,
    totalDeposits: new BN(0),
    totalShares: new BN(0),
    hotPoolBalance: new BN(0),
    coldCapital: new BN(0),
    navPerShare: new BN(1_000_000),
    feeBps: 0,
    vaultPda: null,
    loading: true,
  });

  const fetchVault = useCallback(async () => {
    if (!program || !walletAddress) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    const vaultId = vaultIdForYieldSource(yieldSourceId);
    const [vaultPda] = derivePersonalVaultPda(walletAddress, vaultId);
    try {
      // SAFETY: Anchor IDL typing for dynamic account names
      const account = await (program.account as any).vault.fetchNullable(vaultPda);
      if (!account) {
        setState({
          exists: false,
          isActive: false,
          totalDeposits: new BN(0),
          totalShares: new BN(0),
          hotPoolBalance: new BN(0),
          coldCapital: new BN(0),
          navPerShare: new BN(1_000_000),
          feeBps: 0,
          vaultPda: vaultPda.toBase58(),
          loading: false,
        });
        return;
      }
      setState({
        exists: true,
        isActive: account.isActive,
        totalDeposits: account.totalDeposits as BN,
        totalShares: account.totalShares as BN,
        hotPoolBalance: account.hotPoolBalance as BN,
        coldCapital: account.coldCapital as BN,
        navPerShare: account.navPerShare as BN,
        feeBps: account.feeBps as number,
        vaultPda: vaultPda.toBase58(),
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch vault:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [program, walletAddress, yieldSourceId]);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  return { ...state, refetch: fetchVault };
}
