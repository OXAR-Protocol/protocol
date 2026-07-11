"use client";

import { useCallback, useState } from "react";
import { useFiatOnramp } from "@privy-io/react-auth";
import type { FiatOnrampEnvironment } from "@privy-io/api-types";

import { useSolanaContext } from "@/providers/solana-provider";
import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import { toFriendlyError } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { toBaseUnits } from "@/lib/yield";
import type { WalletAsset } from "@/lib/portfolio/assets";

/**
 * PROTOTYPE (P1 of docs/plans/2026-07-11-usdc-first-onramp-gas.md) — NOT wired to
 * prod yet. USDC-first card buy via Privy's aggregator hook `useFiatOnramp`
 * (Stripe + Meld + MoonPay + Coinbase, routed by region — unlike the legacy
 * `useFundWallet`, which is MoonPay/Coinbase only). Funds USDC (dollars) straight
 * to the wallet, then deposits into the product.
 *
 * ⚠️ GAS (P2, not done): a wallet funded with only USDC can't pay its own deposit
 * tx fee + ATA rent — a gas top-up relayer must drip ~0.003 SOL before the deposit.
 * Until that exists, the deposit step will fail on a fresh wallet; this hook is for
 * validating the FUNDING/Stripe routing in sandbox first.
 */

/** CAIP-2 chain id Privy's on-ramp expects for Solana mainnet (NOT "solana:mainnet"). */
const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
// Flip to "production" once sandbox-validated + gas is solved.
const ONRAMP_ENV: FiatOnrampEnvironment = "sandbox";

export type CardBuyStatus = "idle" | "funding" | "buying";

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
  const { fund } = useFiatOnramp();
  const { depositWith } = useUniversalDeposit(providerId);
  const [status, setStatus] = useState<CardBuyStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const buyWithCard = useCallback(
    async (usdAmount: number): Promise<bigint> => {
      if (!walletAddress) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return BigInt(0);
      const owner = walletAddress.toBase58();

      setError(null);
      try {
        setStatus("funding");
        // Aggregator picks the best enabled provider for the user's region.
        await fund({
          source: {},
          destination: { asset: USDC_MINT, chain: SOLANA_MAINNET_CAIP2, address: owner },
          environment: ONRAMP_ENV,
          defaultAmount: String(Math.max(1, Math.round(usdAmount))),
        });

        // TODO(P2): gas top-up here — POST /api/gas-topup drips ~0.003 SOL so the
        // deposit below can pay its fee + ATA rent. Without it this throws on a
        // fresh (SOL-less) wallet.
        setStatus("buying");
        return await depositWith(usdcAsset(usdAmount), usdAmount);
      } catch (e) {
        console.error("Card buy (USDC-first) failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [walletAddress, fund, depositWith],
  );

  return { buyWithCard, status, busy: status !== "idle", error };
}
