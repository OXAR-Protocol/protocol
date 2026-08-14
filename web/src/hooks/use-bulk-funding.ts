"use client";

import { useCallback, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useSwap } from "@/hooks/use-swap";
import { UserFacingError } from "@/lib/yield";
import {
  spendableBase,
  usdToBase,
  type WalletAsset,
} from "@oxar/sdk";

import { USDC_MINT } from "@/lib/constants";

/**
 * Turn whatever the user wants to pay with into the currency the purchases settle in,
 * ONCE, before a multi-asset buy runs.
 *
 * Converting per asset would mean two transactions and two wallet prompts each — and
 * N separate slippage hits on N small orders, which is worse pricing than one order
 * of the same size. So the whole budget is converted in a single swap and the buys
 * then spend plain USDC.
 *
 * Returns the USD that ACTUALLY landed (the guaranteed-minimum output, which is at or
 * below what was quoted). The caller must re-split the allocations against it —
 * see `rescaleAllocations` — or the last purchase in the run will come up short.
 */
export function useBulkFunding() {
  const { wallet, walletAddress } = useSolanaContext();
  const swap = useSwap();
  const [converting, setConverting] = useState(false);

  const fundUsdc = useCallback(
    async (payAsset: WalletAsset, usdAmount: number): Promise<number> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return 0;
      // Already the settlement currency — nothing to convert, nothing to lose.
      if (payAsset.mint === USDC_MINT) return usdAmount;
      let payBase = usdToBase(payAsset, usdAmount);
      const maxSpend = spendableBase(payAsset);
      if (maxSpend <= BigInt(0)) throw new UserFacingError(`Not enough ${payAsset.symbol} after network fees`);
      if (payBase > maxSpend) payBase = maxSpend;

      setConverting(true);
      try {
        const { minOut } = await swap({ inputMint: payAsset.mint, outputMint: USDC_MINT, amount: payBase });
        // The guaranteed minimum, not the quoted amount: it's the number the wallet is
        // certain to hold. Reading the balance instead would race the confirmation.
        const usdcDecimals = 6;
        return Number(minOut) / 10 ** usdcDecimals;
      } finally {
        setConverting(false);
      }
    },
    [wallet, walletAddress, swap],
  );

  return { fundUsdc, converting };
}
