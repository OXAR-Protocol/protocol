"use client";

import { useCallback } from "react";

import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import { useBridgeDeposit } from "@/hooks/use-bridge-deposit";
import type { WalletAsset } from "@oxar/sdk";

const LABELS: Record<string, string> = {
  quoting: "Quoting…",
  swapping: "Swapping…",
  approving: "Approving…",
  bridging: "Bridging…",
  arriving: "Waiting for funds…",
  depositing: "Depositing…",
};

/**
 * One deposit entry point over both routers: Solana (direct / Jupiter swap) and
 * cross-chain (Delora bridge). Dispatches by the pay-asset's chain and exposes a
 * unified busy status + human label.
 */
export function useDeposit(providerId: string) {
  const solana = useUniversalDeposit(providerId);
  const bridge = useBridgeDeposit(providerId);

  const depositWith = useCallback(
    (payAsset: WalletAsset, usdAmount: number): Promise<bigint> =>
      payAsset.chain === "ethereum"
        ? bridge.bridgeAndDeposit(payAsset, usdAmount)
        : solana.depositWith(payAsset, usdAmount),
    [bridge, solana],
  );

  const status = bridge.status !== "idle" ? bridge.status : solana.status;
  const busy = status !== "idle";
  const error = bridge.error ?? solana.error;

  return { depositWith, busy, status, label: busy ? LABELS[status] ?? "Working…" : null, error };
}
