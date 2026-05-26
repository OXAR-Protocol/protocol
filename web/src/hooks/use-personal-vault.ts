"use client";

import { useCallback, useEffect, useState } from "react";
import { BN } from "@coral-xyz/anchor";

import { derivePersonalVaultPda } from "@oxar/sdk";

import { useOxarProgram } from "./use-oxar-program";

export type TemplateKey = "sleepy" | "walking" | "running";

// vault_id is stable per risk template — each user has up to 3 vaults.
export const TEMPLATE_VAULT_ID: Record<TemplateKey, number> = {
  sleepy: 1,
  walking: 2,
  running: 3,
};

export interface PersonalVaultState {
  exists: boolean;
  isActive: boolean;
  totalDeposits: BN;
  totalShares: BN;
  hotPoolBalance: BN;
  navPerShare: BN;
  feeBps: number;
  vaultPda: string | null;
  loading: boolean;
  refetch: () => void;
}

export function usePersonalVault(template: TemplateKey): PersonalVaultState {
  const { program, walletAddress } = useOxarProgram();
  const [state, setState] = useState<Omit<PersonalVaultState, "refetch">>({
    exists: false,
    isActive: false,
    totalDeposits: new BN(0),
    totalShares: new BN(0),
    hotPoolBalance: new BN(0),
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
    const vaultId = BigInt(TEMPLATE_VAULT_ID[template]);
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
        navPerShare: account.navPerShare as BN,
        feeBps: account.feeBps as number,
        vaultPda: vaultPda.toBase58(),
        loading: false,
      });
    } catch (err) {
      console.error("Failed to fetch vault:", err);
      setState((s) => ({ ...s, loading: false }));
    }
  }, [program, walletAddress, template]);

  useEffect(() => {
    fetchVault();
  }, [fetchVault]);

  return { ...state, refetch: fetchVault };
}
