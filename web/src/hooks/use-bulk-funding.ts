"use client";

import { useCallback, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { UserFacingError } from "@/lib/yield";
import {
  getSwapQuote,
  buildSwapTx,
  deserializeSwapTx,
  priceImpactTooHigh,
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
  const { wallet, connection, walletAddress, isExternal } = useSolanaContext();
  const [converting, setConverting] = useState(false);

  const fundUsdc = useCallback(
    async (payAsset: WalletAsset, usdAmount: number): Promise<number> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return 0;
      // Already the settlement currency — nothing to convert, nothing to lose.
      if (payAsset.mint === USDC_MINT) return usdAmount;
      if (payAsset.chain !== "solana") {
        throw new UserFacingError(
          "Paying from another chain takes a couple of minutes to arrive, so it can't fund " +
            "several purchases at once yet. Buy them one at a time, or pay with something on Solana.",
        );
      }

      let payBase = usdToBase(payAsset, usdAmount);
      const maxSpend = spendableBase(payAsset);
      if (maxSpend <= BigInt(0)) throw new UserFacingError(`Not enough ${payAsset.symbol} after network fees`);
      if (payBase > maxSpend) payBase = maxSpend;

      setConverting(true);
      try {
        // External wallets mishandle Jupiter's v0 transactions — same rule as the
        // single-asset path.
        const asLegacy = isExternal;
        const quote = await getSwapQuote({
          inputMint: payAsset.mint,
          outputMint: USDC_MINT,
          amount: payBase,
          asLegacy,
        });
        if (priceImpactTooHigh(quote)) {
          throw new UserFacingError("Price impact too high — try a smaller amount");
        }

        const tx = deserializeSwapTx(await buildSwapTx(quote, walletAddress.toBase58(), { asLegacy }), asLegacy);
        const sig = await wallet.signAndSend(tx);
        await connection.confirmTransaction(sig, "confirmed");

        // The guaranteed minimum, not the quoted amount: it's the number the wallet is
        // certain to hold. Reading the balance instead would race the confirmation.
        const usdcDecimals = 6;
        return Number(BigInt(quote.otherAmountThreshold)) / 10 ** usdcDecimals;
      } finally {
        setConverting(false);
      }
    },
    [wallet, walletAddress, connection, isExternal],
  );

  return { fundUsdc, converting };
}
