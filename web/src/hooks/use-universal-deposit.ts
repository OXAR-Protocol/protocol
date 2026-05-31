"use client";

import { useCallback, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { getProvider, toBaseUnits, toFriendlyError } from "@/lib/yield";
import { chooseDepositPath } from "@/lib/yield/deposit-path";
import { getSwapQuote, buildSwapTx, priceImpactTooHigh } from "@/lib/swap/jupiter-swap";
import { spendableBase, type WalletAsset } from "@/lib/portfolio/assets";

export type DepositStatus = "idle" | "swapping" | "depositing";

/**
 * Universal deposit: take a USD amount + the wallet asset to pay with, route it
 * (direct USDC / Jupiter swap → USDC / [bridge — Story 4]) into the product.
 * Swap path = two txs (swap, then deposit the REALIZED USDC delta). Returns the
 * USDC base units actually deposited.
 */
export function useUniversalDeposit(providerId: string) {
  const { wallet, connection, walletAddress } = useSolanaContext();
  const { deposit } = useYieldActions(providerId);
  const [status, setStatus] = useState<DepositStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const depositWith = useCallback(
    async (payAsset: WalletAsset, usdAmount: number): Promise<bigint> => {
      const provider = getProvider(providerId);
      if (!wallet || !walletAddress || !provider) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return BigInt(0);

      const productMint = provider.asset.toBase58();
      const path = chooseDepositPath({ payMint: payAsset.mint, payChain: payAsset.chain, productMint });

      setError(null);
      let specificError = false;
      try {
        if (path === "direct") {
          setStatus("depositing");
          const amount = toBaseUnits(usdAmount, provider.decimals);
          await deposit(amount);
          return amount;
        }

        if (path === "swap") {
          // USD → pay-asset base units, reserving SOL for fees.
          const price = payAsset.usdValue / payAsset.uiAmount;
          const payUi = usdAmount / price;
          const payBase = toBaseUnits(payUi.toFixed(payAsset.decimals), payAsset.decimals);
          const maxSpend = spendableBase(payAsset);
          if (maxSpend <= BigInt(0)) throw new Error(`Not enough ${payAsset.symbol} after network fees`);
          if (payBase > maxSpend) throw new Error(`Not enough ${payAsset.symbol}`);

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

          // Deposit the guaranteed-min output (otherAmountThreshold ≤ realized), so the
          // deposit can't fail on slippage; any tiny remainder stays as USDC in the wallet.
          // (Avoids a balance-read race that could falsely report "no USDC arrived".)
          const depositAmount = BigInt(quote.otherAmountThreshold);
          setStatus("depositing");
          try {
            await deposit(depositAmount);
          } catch (depositErr) {
            console.error("Deposit failed after swap:", depositErr);
            setError(
              "Swap succeeded but the deposit failed — your USDC is in your wallet. " +
                "You can deposit it directly (select USDC).",
            );
            specificError = true;
            throw depositErr;
          }
          return depositAmount;
        }

        // path === "bridge" — cross-chain (Story 4) not wired yet.
        throw new Error("Cross-chain deposits are coming soon");
      } catch (e) {
        console.error("Universal deposit failed:", e);
        if (!specificError) setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [wallet, walletAddress, connection, deposit, providerId],
  );

  return { depositWith, status, error };
}
