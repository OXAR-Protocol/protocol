"use client";

import { useCallback } from "react";

import { convertibleUsd, planTopUp, spendableUsd, type WalletAsset } from "@oxar/sdk";

import { useBulkFunding } from "@/hooks/use-bulk-funding";
import { USDC_MINT } from "@/lib/constants";

/**
 * The money a basket can actually spend, and the step that gets it there.
 *
 * Two figures, kept apart on purpose: `cashUsd` is dollars, ready now; `spareUsd` is
 * everything else the wallet holds, which is spendable only after a swap. The screen
 * shows both and says which is which — a budget that quietly included a trade would
 * be a cost hidden inside a purchase.
 */
export function useTopUp(assets: readonly WalletAsset[]) {
  const { fundUsdc, converting } = useBulkFunding();

  const usdc = assets.find((a) => a.mint === USDC_MINT);
  const cashUsd = usdc ? spendableUsd(usdc) : 0;
  const spareUsd = convertibleUsd(assets, USDC_MINT);

  /** Convert enough to cover `shortfallUsd`. Returns the dollars that actually
   *  landed — at or under what was quoted, which is what the caller must spend. */
  const topUp = useCallback(
    async (shortfallUsd: number): Promise<number> => {
      let landed = 0;
      for (const leg of planTopUp(assets, shortfallUsd, USDC_MINT)) {
        landed += await fundUsdc(leg.asset, leg.usd);
        if (landed >= shortfallUsd) break;
      }
      return landed;
    },
    [assets, fundUsdc],
  );

  return { cashUsd, spareUsd, topUp, converting };
}
