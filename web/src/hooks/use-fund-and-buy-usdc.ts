"use client";

import { useCallback, useState } from "react";
import { useFiatOnramp } from "@privy-io/react-auth";
import type { FiatOnrampEnvironment } from "@privy-io/api-types";
import { PublicKey, type Connection } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

import { useSolanaContext } from "@/providers/solana-provider";
import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import { toFriendlyError, UserFacingError } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { toBaseUnits } from "@/lib/yield";
import type { WalletAsset } from "@/lib/portfolio/assets";

/**
 * USDC-first card buy via Privy's aggregator hook `useFiatOnramp` (MoonPay /
 * Coinbase / Stripe, routed by region). Funds USDC (dollars) straight to the
 * wallet, waits for it to land, then deposits into the product. Gas on the deposit
 * is sponsored via Privy "App pays" (`sponsor: true`), so a wallet with no SOL
 * works. See docs/plans/2026-07-11-usdc-first-onramp-gas.md.
 */

/** CAIP-2 chain id Privy's on-ramp expects for Solana mainnet (NOT "solana:mainnet"). */
const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";
// Real card + real USDC by default; set NEXT_PUBLIC_ONRAMP_ENV=sandbox to dry-run.
const ONRAMP_ENV: FiatOnrampEnvironment =
  process.env.NEXT_PUBLIC_ONRAMP_ENV === "sandbox" ? "sandbox" : "production";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export type CardBuyStatus = "idle" | "funding" | "arriving" | "buying";

/** The wallet's USDC balance in UI units (0 if the ATA doesn't exist yet). */
async function getUsdcUi(connection: Connection, owner: PublicKey): Promise<number> {
  try {
    const ata = await getAssociatedTokenAddress(new PublicKey(USDC_MINT), owner);
    const bal = await connection.getTokenAccountBalance(ata);
    return bal.value.uiAmount ?? 0;
  } catch {
    return 0; // no ATA / not funded yet
  }
}

/** Poll until the USDC balance rises by ≥ `minDelta` (funds landed), or timeout.
 *  Returns the realized delta in UI units (what actually arrived). */
async function pollUsdcArrival(
  connection: Connection,
  owner: PublicKey,
  baseline: number,
  minDelta: number,
  timeoutMs = 10 * 60 * 1000,
): Promise<number> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = await getUsdcUi(connection, owner);
    if (current - baseline >= minDelta) return current - baseline;
    await sleep(4000);
  }
  const current = await getUsdcUi(connection, owner);
  return Math.max(0, current - baseline);
}

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
  const { walletAddress, connection } = useSolanaContext();
  const { fund } = useFiatOnramp();
  const { depositWith } = useUniversalDeposit(providerId);
  const [status, setStatus] = useState<CardBuyStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const buyWithCard = useCallback(
    async (usdAmount: number): Promise<bigint> => {
      if (!walletAddress) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return BigInt(0);
      const owner = walletAddress;

      setError(null);
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
        await funding;

        // The provider confirms before the USDC settles on-chain — wait for it to
        // actually land, then buy the REALIZED amount (net of provider fees).
        setStatus("arriving");
        const arrived = await pollUsdcArrival(connection, owner, baseline, Math.max(1, usdAmount * 0.5));
        if (arrived <= 0) {
          throw new UserFacingError(
            "We didn't see your funds arrive yet — card top-ups can take a few minutes. " +
              "Once your USDC lands you can buy straight from your balance.",
          );
        }

        // Gas on the deposit is sponsored via Privy "App pays" — a SOL-less wallet works.
        setStatus("buying");
        return await depositWith(usdcAsset(arrived), arrived, { sponsor: true });
      } catch (e) {
        console.error("Card buy (USDC-first) failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [walletAddress, connection, fund, depositWith],
  );

  return { buyWithCard, status, busy: status !== "idle", error };
}
