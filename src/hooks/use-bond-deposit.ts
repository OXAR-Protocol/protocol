"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import type { VaultConfig } from "@oxar/sdk";

import { useDeposit } from "./use-deposit";
import { deriveVaultPda } from "@/lib/pda";

interface UseBondDepositResult {
  invest: (amount: number) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useBondDeposit(config: VaultConfig): UseBondDepositResult {
  const { deposit, loading, error } = useDeposit();
  const router = useRouter();

  const invest = useCallback(
    async (amount: number) => {
      if (!amount || amount <= 0) return;
      const [pda] = deriveVaultPda(
        config.region,
        config.denomination,
        config.assetSubtype,
        config.series,
      );
      console.log(
        `[OXAR] Depositing to vault PDA ${pda.toBase58()} (series=${config.series}, config=${config.id})`,
      );
      const amountBn = new BN(Math.floor(amount * 1_000_000));
      const tx = await deposit(pda, amountBn);
      if (tx) router.push("/portfolio");
    },
    [config, deposit, router],
  );

  return { invest, loading, error };
}
