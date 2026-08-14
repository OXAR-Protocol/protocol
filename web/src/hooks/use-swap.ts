"use client";

import { useCallback } from "react";

import {
  getSwapQuote,
  buildSwapTx,
  deserializeSwapTx,
  priceImpactTooHigh,
} from "@oxar/sdk";

import { useSolanaContext } from "@/providers/solana-provider";
import { UserFacingError } from "@/lib/yield";

/** What a completed swap is worth saying: what signed it, and the least it produced. */
export interface SwapResult {
  sig: string;
  /** Guaranteed-minimum output in base units (`otherAmountThreshold`). The realized
   *  amount is at or above it, and this is the figure a caller can spend without
   *  racing the confirmation by re-reading the balance. */
  minOut: bigint;
}

/**
 * One swap, done the same way every time.
 *
 * Three callers had their own copy of these six lines — quote, refuse a bad price,
 * build, deserialize, sign, confirm — and each copy carried the same two hard-won
 * details: external wallets need a legacy transaction because they mishandle
 * Jupiter's v0, and the amount to trust afterwards is the guaranteed minimum, not
 * the quote. A detail learned once and written three times is a detail that will be
 * fixed in two places.
 */
export function useSwap() {
  const { wallet, connection, walletAddress, isExternal } = useSolanaContext();

  const swap = useCallback(
    async (params: {
      inputMint: string;
      outputMint: string;
      /** Base units of the input asset. */
      amount: bigint;
      /** Passed through to the wallet — carries the gasless sponsor flag. */
      opts?: { sponsor?: boolean };
    }): Promise<SwapResult> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");

      // External wallets need a legacy tx (they mishandle Jupiter's v0); embedded keeps v0.
      const asLegacy = isExternal;
      const quote = await getSwapQuote({
        inputMint: params.inputMint,
        outputMint: params.outputMint,
        amount: params.amount,
        asLegacy,
      });
      if (priceImpactTooHigh(quote)) {
        throw new UserFacingError("Price impact too high — try a smaller amount");
      }

      const tx = deserializeSwapTx(await buildSwapTx(quote, walletAddress.toBase58(), { asLegacy }), asLegacy);
      const sig = await wallet.signAndSend(tx, params.opts);
      await connection.confirmTransaction(sig, "confirmed");

      return { sig, minOut: BigInt(quote.otherAmountThreshold) };
    },
    [wallet, walletAddress, connection, isExternal],
  );

  return swap;
}
