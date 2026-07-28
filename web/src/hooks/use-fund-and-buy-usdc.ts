"use client";

import { useCallback, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import { useCardTopUp } from "@/hooks/use-card-topup";
import { toFriendlyError } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { toBaseUnits } from "@/lib/yield";
import type { WalletAsset } from "@oxar/sdk";

/**
 * USDC-first card buy: top up with a card / Apple Pay (see `useCardTopUp`), then buy
 * with what actually landed. Gas on the deposit is sponsored via Privy "App pays"
 * (`sponsor: true`), so a wallet with no SOL works.
 */

export type CardBuyStatus = "idle" | "funding" | "arriving" | "buying";

/** A nominal USDC pay-asset (price $1) for the universal deposit math. */
function usdcAsset(usdAmount: number): WalletAsset {
  return {
    mint: USDC_MINT,
    symbol: "USDC",
    decimals: 6,
    amount: toBaseUnits(usdAmount.toFixed(6), 6),
    uiAmount: usdAmount,
    usdValue: usdAmount,
    chain: "solana",
  };
}

export function useFundAndBuyUsdc(providerId: string) {
  const { walletAddress } = useSolanaContext();
  const { topUp, status: topUpStatus } = useCardTopUp();
  const { depositWith } = useUniversalDeposit(providerId);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyWithCard = useCallback(
    async (usdAmount: number): Promise<bigint> => {
      if (!walletAddress) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return BigInt(0);

      setError(null);
      try {
        const arrived = await topUp(usdAmount);
        // Buy the REALIZED amount (net of provider fees), not what was typed in.
        setBuying(true);
        return await depositWith(usdcAsset(arrived), arrived, { sponsor: true });
      } catch (e) {
        console.error("Card buy (USDC-first) failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setBuying(false);
      }
    },
    [walletAddress, topUp, depositWith],
  );

  const status: CardBuyStatus = buying ? "buying" : topUpStatus;
  return { buyWithCard, status, busy: status !== "idle", error };
}
