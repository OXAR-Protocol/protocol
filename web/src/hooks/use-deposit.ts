"use client";

import { useCallback } from "react";

import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import type { WalletAsset } from "@oxar/sdk";

const LABELS: Record<string, string> = {
  quoting: "Quoting…",
  swapping: "Swapping…",
  depositing: "Depositing…",
};

/**
 * One deposit entry point: pay from the Solana wallet, directly or through a swap.
 *
 * It used to dispatch to a second, cross-chain router when the pay-asset lived on an
 * EVM chain. Nothing reaches that branch any more — buying spends the wallet's
 * dollars, and money from another chain arrives as a deposit address before any of
 * this runs — so the branch, and the linked wallet it needed, are gone.
 */
export function useDeposit(providerId: string) {
  const solana = useUniversalDeposit(providerId);

  const depositWith = useCallback(
    (payAsset: WalletAsset, usdAmount: number): Promise<bigint> => solana.depositWith(payAsset, usdAmount),
    [solana],
  );

  const busy = solana.status !== "idle";

  return {
    depositWith,
    busy,
    status: solana.status,
    label: busy ? LABELS[solana.status] ?? "Working…" : null,
    error: solana.error,
  };
}
