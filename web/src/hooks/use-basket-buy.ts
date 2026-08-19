"use client";

import { useCallback, useState } from "react";

import { rescaleAllocations } from "@oxar/sdk";

import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useTopUp } from "@/hooks/use-top-up";
import { toFriendlyError } from "@/lib/yield";
import type { BulkTradeOutcome } from "@/hooks/use-bulk-trade";

/**
 * Paying for a basket, including the part where the money isn't dollars yet.
 *
 * Buying settles in USDC, and the app used to make that the user's problem: a wallet
 * holding $40 of SOL and no USDC was told it had nothing to spend, and the way out
 * was a separate screen that turned coins into dollars and sent you back. Now the
 * conversion happens on the way through — quoted before it runs, one swap for the
 * whole gap rather than one per purchase, and the allocations are re-fitted to the
 * dollars that ACTUALLY arrived rather than the ones that were quoted.
 */
export function useBasketBuy(run: (jobs: { kind: "buy"; id: string; amountUsd: number }[]) => Promise<BulkTradeOutcome[]>) {
  const { assets, refresh } = useWalletAssets();
  const { cashUsd, spareUsd, topUp, converting } = useTopUp(assets);
  const [error, setError] = useState<string | null>(null);

  const buy = useCallback(
    async (amounts: Record<string, number>): Promise<BulkTradeOutcome[]> => {
      setError(null);
      const wanted = Object.values(amounts).reduce((sum, v) => sum + v, 0);
      let spendable = cashUsd;

      // A gap of a few cents isn't worth a swap — the allocations are trimmed to the
      // dollars already there instead, which is what `rescaleAllocations` is for.
      if (wanted > cashUsd + 0.05) {
        try {
          spendable = cashUsd + (await topUp(wanted - cashUsd));
        } catch (e) {
          console.error("Top-up failed:", e);
          setError(toFriendlyError(e));
          return [];
        }
        void refresh();
      }

      const final = rescaleAllocations(amounts, spendable);
      const jobs = Object.entries(final).map(([id, amountUsd]) => ({ kind: "buy" as const, id, amountUsd }));
      if (jobs.length === 0) return [];
      return run(jobs);
    },
    [cashUsd, topUp, refresh, run],
  );

  return {
    /** Dollars, ready to spend now. */
    cashUsd,
    /** Everything else the wallet holds, which a swap can turn into dollars. */
    spareUsd,
    budgetUsd: cashUsd + spareUsd,
    converting,
    error,
    setError,
    refreshAssets: refresh,
    buy,
  };
}
