"use client";

import { useCallback, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { getProvider, toBaseUnits, toFriendlyError } from "@/lib/yield";
import { chooseDepositPath } from "@/lib/yield/deposit-path";
import {
  getSwapQuote,
  buildSwapTx,
  priceImpactTooHigh,
} from "@/lib/swap/jupiter-swap";
import type { WalletAsset } from "@/lib/portfolio/assets";

export type DepositStatus = "idle" | "swapping" | "depositing";

/**
 * Universal deposit: take a USD amount + the wallet asset to pay with, route it
 * (direct USDC / Jupiter swap → USDC / [bridge — Story 4]) into the product. The
 * swap path is two txs (swap, then deposit the guaranteed-min USDC out).
 */
export function useUniversalDeposit(providerId: string) {
  const { wallet, connection, walletAddress } = useSolanaContext();
  const { deposit } = useYieldActions(providerId);
  const [status, setStatus] = useState<DepositStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const depositWith = useCallback(
    async (payAsset: WalletAsset, usdAmount: number): Promise<void> => {
      const provider = getProvider(providerId);
      if (!wallet || !walletAddress || !provider) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return;

      const productMint = provider.asset.toBase58();
      const path = chooseDepositPath({
        payMint: payAsset.mint,
        payChain: "solana",
        productMint,
      });

      setError(null);
      try {
        if (path === "direct") {
          setStatus("depositing");
          await deposit(toBaseUnits(usdAmount, provider.decimals));
          return;
        }

        if (path === "swap") {
          // USD → pay-asset base units (using the asset's live USD price).
          const price = payAsset.usdValue / payAsset.uiAmount;
          const payUi = usdAmount / price;
          const payBase = toBaseUnits(payUi.toFixed(payAsset.decimals), payAsset.decimals);
          if (payBase > payAsset.amount) throw new Error(`Not enough ${payAsset.symbol}`);

          setStatus("swapping");
          const quote = await getSwapQuote({
            inputMint: payAsset.mint,
            outputMint: productMint,
            amount: payBase,
          });
          if (priceImpactTooHigh(quote)) {
            throw new Error("Price impact too high — try a smaller amount");
          }

          const b64 = await buildSwapTx(quote, walletAddress.toBase58());
          const tx = VersionedTransaction.deserialize(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
          const signed = await wallet.signTransaction(tx);
          const sig = await connection.sendRawTransaction(signed.serialize());
          await connection.confirmTransaction(sig, "confirmed");

          setStatus("depositing");
          // Deposit the guaranteed-min output (≤ realized), so the deposit can't
          // fail on a few units of slippage; the tiny remainder stays in the wallet.
          await deposit(BigInt(quote.otherAmountThreshold));
          return;
        }

        // path === "bridge" — cross-chain (Story 4) not wired yet.
        throw new Error("Cross-chain deposits are coming soon");
      } catch (e) {
        console.error("Universal deposit failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [wallet, walletAddress, connection, deposit, providerId],
  );

  return { depositWith, status, error };
}
