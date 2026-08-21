"use client";

import { useCallback, useRef, useState } from "react";
import { useFiatOnramp } from "@privy-io/react-auth";
import type { FiatOnrampEnvironment } from "@privy-io/api-types";
import { PublicKey, type Connection } from "@solana/web3.js";

import { pollArrival } from "@oxar/sdk";
import { useSolanaContext } from "@/providers/solana-provider";
import { readUsdcUsd } from "@/lib/usdc-balance";
import { UserFacingError } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";

/**
 * Put dollars in the wallet with a card / Apple Pay, and wait until they're really
 * there. Nothing is bought here — that's the caller's business, and it's what lets
 * one card top-up pay for a single purchase or a whole basket.
 *
 * Via Privy's aggregator (`useFiatOnramp` → MoonPay / Coinbase / Stripe by region).
 * See docs/plans/2026-07-11-usdc-first-onramp-gas.md.
 */

/** CAIP-2 chain id Privy's on-ramp expects for Solana mainnet (NOT "solana:mainnet"). */
const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
// Real card + real USDC by default; set NEXT_PUBLIC_ONRAMP_ENV=sandbox to dry-run.
const ONRAMP_ENV: FiatOnrampEnvironment =
  process.env.NEXT_PUBLIC_ONRAMP_ENV === "sandbox" ? "sandbox" : "production";

export type CardTopUpStatus = "idle" | "funding" | "arriving";

/**
 * The wallet's USDC balance in UI units.
 *
 * One reader for the dollars, shared with every screen that prints them: this used to
 * be a second implementation that looked at the associated token account alone, so a
 * balance held anywhere else read as zero and the same number differed by screen.
 */
export const getUsdcUi = readUsdcUsd;

/** Poll until the USDC balance rises by ≥ `minDelta` (funds landed), or timeout.
 *  Returns the realized delta in UI units (what actually arrived). Thin wrapper
 *  around the shared `pollArrival` — see its doc for why `stopped()` exists. */
function pollUsdcArrival(
  connection: Connection,
  owner: PublicKey,
  baseline: number,
  minDelta: number,
  stopped: () => boolean,
  timeoutMs = 10 * 60 * 1000,
): Promise<number> {
  return pollArrival(() => getUsdcUi(connection, owner), baseline, minDelta, stopped, timeoutMs);
}

export function useCardTopUp() {
  const { walletAddress, connection } = useSolanaContext();
  const { fund } = useFiatOnramp();
  const [status, setStatus] = useState<CardTopUpStatus>("idle");
  // Closing the provider's window doesn't resolve `fund()` as "cancelled" — the
  // result type only knows 'submitted' and 'confirmed' — so a user who backs out
  // leaves us awaiting a promise that may never settle, and then waiting ten
  // minutes for money that isn't coming. This is the way out of both.
  const cancelRef = useRef<((reason: Error) => void) | null>(null);
  const stoppedRef = useRef(false);

  /** Stop waiting. Nothing was charged if the provider flow was abandoned; if it
   *  wasn't, the money still arrives and simply shows up as balance. */
  const cancel = useCallback(() => {
    stoppedRef.current = true;
    cancelRef.current?.(new UserFacingError("Stopped waiting — nothing was charged."));
  }, []);

  /** Returns the USDC that actually landed, in dollars — net of the provider's fees,
   *  which is always less than what the user typed into the card form. */
  const topUp = useCallback(
    async (usdAmount: number): Promise<number> => {
      if (!walletAddress) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return 0;
      const owner = walletAddress;

      stoppedRef.current = false;
      const abandoned = new Promise<never>((_, reject) => {
        cancelRef.current = reject;
      });

      try {
        setStatus("funding");
        // Call fund() synchronously inside the click (any await before it can drop
        // the user-activation and block the popup on mobile). Snapshot the baseline
        // AFTER, while the flow is open.
        const funding = fund({
          source: {},
          destination: { asset: USDC_MINT, chain: SOLANA_MAINNET_CAIP2, address: owner.toBase58() },
          environment: ONRAMP_ENV,
          defaultAmount: String(Math.max(1, Math.round(usdAmount))),
        });
        const baseline = await getUsdcUi(connection, owner);
        await Promise.race([funding, abandoned]);

        // The provider confirms before the USDC settles on-chain — wait for it to
        // actually land, then report the REALIZED amount.
        setStatus("arriving");
        const arrived = await Promise.race([
          pollUsdcArrival(connection, owner, baseline, Math.max(1, usdAmount * 0.5), () => stoppedRef.current),
          abandoned,
        ]);
        if (arrived <= 0) {
          throw new UserFacingError(
            "We didn't see your funds arrive yet — card top-ups can take a few minutes. " +
              "Once your USDC lands you can buy straight from your balance.",
          );
        }
        return arrived;
      } finally {
        setStatus("idle");
        cancelRef.current = null;
      }
    },
    [walletAddress, connection, fund],
  );

  return { topUp, cancel, status, busy: status !== "idle" };
}
