"use client";

import { useCallback, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { useSwap } from "@/hooks/use-swap";
import { getProvider, toBaseUnits, toFriendlyError, UserFacingError } from "@/lib/yield";
import { chooseDepositPath, spendableBase, type WalletAsset } from "@oxar/sdk";
import { trackEvent } from "@/lib/track";

export type DepositStatus = "idle" | "swapping" | "depositing";

/**
 * Universal deposit: take a USD amount + the wallet asset to pay with, route it
 * (direct USDC / Jupiter swap → USDC / [bridge — Story 4]) into the product.
 * Swap path = two txs (swap, then deposit the REALIZED USDC delta). Returns the
 * USDC base units actually deposited.
 */
export function useUniversalDeposit(providerId: string) {
  const { wallet, walletAddress } = useSolanaContext();
  const { deposit } = useYieldActions(providerId);
  const swap = useSwap();
  const [status, setStatus] = useState<DepositStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const depositWith = useCallback(
    async (payAsset: WalletAsset, usdAmount: number, opts?: { sponsor?: boolean }): Promise<bigint> => {
      const provider = getProvider(providerId);
      if (!wallet || !walletAddress || !provider) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return BigInt(0);

      const productMint = provider.asset.toBase58();
      const path = chooseDepositPath({ payMint: payAsset.mint, productMint });

      setError(null);
      try {
        if (path === "direct") {
          setStatus("depositing");
          const amount = toBaseUnits(usdAmount, provider.decimals);
          const sig = await deposit(amount, opts);
          trackEvent({ wallet: walletAddress.toBase58(), kind: "deposit", asset: providerId, usd: usdAmount, sig, chain: payAsset.chain });
          return amount;
        }

        // Not direct, so: swap into the product's asset first.
        {
          // USD → pay-asset base units, reserving SOL for fees.
          const price = payAsset.usdValue / payAsset.uiAmount;
          const payUi = usdAmount / price;
          let payBase = toBaseUnits(payUi.toFixed(payAsset.decimals), payAsset.decimals);
          const maxSpend = spendableBase(payAsset);
          if (maxSpend <= BigInt(0)) throw new UserFacingError(`Not enough ${payAsset.symbol} after network fees`);
          // Clamp to the spendable balance instead of failing — the USD→units round-trip
          // (and a MAX press) can land payBase a sub-unit over the real balance. Spends
          // what's there, never over.
          if (payBase > maxSpend) payBase = maxSpend;

          setStatus("swapping");
          const { minOut } = await swap({
            inputMint: payAsset.mint,
            outputMint: productMint,
            amount: payBase,
            opts,
          });

          // Deposit the guaranteed-min output, so the deposit can't fail on slippage;
          // any tiny remainder stays as USDC in the wallet.
          const depositAmount = minOut;
          setStatus("depositing");
          try {
            const depositSig = await deposit(depositAmount, opts);
            trackEvent({ wallet: walletAddress.toBase58(), kind: "deposit", asset: providerId, usd: usdAmount, sig: depositSig, chain: payAsset.chain });
          } catch (depositErr) {
            console.error("Deposit failed after swap:", depositErr);
            throw new UserFacingError(
              "Swap succeeded but the deposit failed — your USDC is in your wallet. " +
                "You can deposit it directly (select USDC).",
            );
          }
          return depositAmount;
        }

      } catch (e) {
        console.error("Universal deposit failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [wallet, walletAddress, deposit, providerId, swap],
  );

  return { depositWith, status, error };
}
