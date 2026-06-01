"use client";

import { useCallback, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { getProvider, toBaseUnits, toFriendlyError, UserFacingError } from "@/lib/yield";
import { chooseDepositPath } from "@/lib/yield/deposit-path";
import { getSwapQuote, buildSwapTx, deserializeSwapTx, priceImpactTooHigh } from "@/lib/swap/jupiter-swap";
import { spendableBase, type WalletAsset } from "@/lib/portfolio/assets";

export type DepositStatus = "idle" | "swapping" | "depositing";

/**
 * Universal deposit: take a USD amount + the wallet asset to pay with, route it
 * (direct USDC / Jupiter swap → USDC / [bridge — Story 4]) into the product.
 * Swap path = two txs (swap, then deposit the REALIZED USDC delta). Returns the
 * USDC base units actually deposited.
 */
export function useUniversalDeposit(providerId: string) {
  const { wallet, connection, walletAddress, isExternal } = useSolanaContext();
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
          if (maxSpend <= BigInt(0)) throw new UserFacingError(`Not enough ${payAsset.symbol} after network fees`);
          if (payBase > maxSpend) throw new UserFacingError(`Not enough ${payAsset.symbol}`);

          setStatus("swapping");
          // External wallets need a legacy tx (they mishandle Jupiter's v0); embedded keeps v0.
          const asLegacy = isExternal;
          const quote = await getSwapQuote({
            inputMint: payAsset.mint,
            outputMint: productMint,
            amount: payBase,
            asLegacy,
          });
          if (priceImpactTooHigh(quote)) {
            throw new UserFacingError("Price impact too high — try a smaller amount");
          }

          const b64 = await buildSwapTx(quote, walletAddress.toBase58(), { asLegacy });
          const tx = deserializeSwapTx(b64, asLegacy);
          const sig = await wallet.signAndSend(tx);
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
            throw new UserFacingError(
              "Swap succeeded but the deposit failed — your USDC is in your wallet. " +
                "You can deposit it directly (select USDC).",
            );
          }
          return depositAmount;
        }

        // path === "bridge" — handled by useBridgeDeposit, not here.
        throw new UserFacingError("Cross-chain deposits are coming soon");
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
