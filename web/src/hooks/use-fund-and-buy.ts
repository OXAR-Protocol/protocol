"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useFundWallet } from "@privy-io/react-auth/solana";
import type { Connection, PublicKey } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import { toFriendlyError, UserFacingError } from "@/lib/yield";
import { SOL_MINT, type WalletAsset } from "@oxar/sdk";

export type FundBuyStatus = "idle" | "funding" | "arriving" | "buying";

const LABELS: Record<Exclude<FundBuyStatus, "idle">, string> = {
  funding: "Opening Apple Pay…",
  arriving: "Waiting for your funds…",
  buying: "Buying…",
};

const LAMPORTS_PER_SOL = 1_000_000_000;
// Gas reserve kept back from the buy — larger than the generic SOL_FEE_RESERVE
// because this buy is two txs (swap + deposit) plus token-account rent.
const APPLE_PAY_GAS_RESERVE = 25_000_000; // ~0.025 SOL
// "Real funds landed" floor for arrival detection (well below any real purchase).
const MIN_ARRIVAL_LAMPORTS = 15_000_000; // ~0.015 SOL
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Current SOL price (USD) via Jupiter Price v3. 0 if unavailable. */
async function getSolPrice(): Promise<number> {
  try {
    const res = await fetch(`https://lite-api.jup.ag/price/v3?ids=${SOL_MINT}`);
    if (!res.ok) return 0;
    const json = (await res.json()) as Record<string, { usdPrice?: number } | undefined>;
    return json[SOL_MINT]?.usdPrice ?? 0;
  } catch {
    return 0;
  }
}

/** Poll the wallet's SOL balance until it rises by ≥ `expected` lamports, or timeout. */
async function pollSolArrival(
  connection: Connection,
  owner: PublicKey,
  baseline: number,
  expected: number,
  timeoutMs = 10 * 60 * 1000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const current = await connection.getBalance(owner);
    if (current - baseline >= expected) return true;
    await sleep(4000);
  }
  return false;
}

/**
 * Buy ANY asset with Apple Pay / card — one flow for every provider.
 *
 *   Apple Pay → SOL into the user's own wallet (Privy on-ramp, card flow) → keep a
 *   small gas reserve → swap the rest into the chosen asset via the existing
 *   universal deposit (SOL→USDC→product).
 *
 * The on-ramp is sized in SOL from the USD the user typed in our field, so the
 * provider opens PRE-FILLED to that amount (no re-entry, no surprise). NOTE:
 * Privy's funding `amount` is denominated in the asset (SOL), not USD — passing
 * USD directly would charge that many SOL (the ~$1,400 bug). We convert with a
 * pre-fetched SOL price so the conversion is synchronous at click time (an
 * `await` before fundWallet breaks the mobile user-gesture → blank screen).
 *
 * Funding SOL means the wallet also ends up with the SOL it needs to pay for the
 * buy tx — works on a brand-new empty wallet, no gas sponsorship. Non-custodial:
 * the on-ramp provider is the regulated merchant.
 */
export function useFundAndBuy(providerId: string) {
  const { connection, walletAddress } = useSolanaContext();
  const { fundWallet } = useFundWallet({
    onUserExited: (params) => console.warn("[oxar] funding exited", params),
  });
  const { depositWith } = useUniversalDeposit(providerId);
  const [status, setStatus] = useState<FundBuyStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Keep a fresh SOL price ready so we can size the on-ramp synchronously on tap.
  const solPriceRef = useRef(0);
  useEffect(() => {
    let cancelled = false;
    const refresh = () => getSolPrice().then((p) => { if (!cancelled && p > 0) solPriceRef.current = p; });
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const buyWithApplePay = useCallback(
    async (usdAmount: number): Promise<bigint> => {
      if (!walletAddress) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return BigInt(0);
      const owner = walletAddress;

      setError(null);
      try {
        // CRITICAL (mobile): fundWallet MUST be called synchronously inside the click.
        // Any `await` before it drops the user-activation, and iOS/Android then BLOCK the
        // funding popup ("doesn't open on phone"). So size the on-ramp from the CACHED
        // price only — never await here; if it isn't ready, open without a pre-fill and
        // let the user type the amount. The exact price is fetched AFTER funding (below).
        const cachedPrice = solPriceRef.current;

        setStatus("funding");
        const funding = fundWallet({
          address: owner.toBase58(),
          options: {
            asset: "native-currency",
            // Pre-fill ~$usdAmount when we already know the price; omit it otherwise.
            ...(cachedPrice > 0 ? { amount: (usdAmount / cachedPrice).toFixed(4) } : {}),
            defaultFundingMethod: "card", // card flow surfaces Apple Pay on supported devices
            // No provider pinned — Privy routes to whichever on-ramp is enabled +
            // available for the user's geo (MoonPay / Stripe / Coinbase).
          },
        });

        const baseline = await connection.getBalance(owner);
        await funding;

        // Past the user gesture now — awaiting is safe. We need the price for the swap math.
        const price = solPriceRef.current || (await getSolPrice());
        if (price <= 0) throw new UserFacingError("Couldn't price SOL — try again");

        setStatus("arriving");
        const arrived = await pollSolArrival(connection, owner, baseline, MIN_ARRIVAL_LAMPORTS);
        if (!arrived) {
          throw new UserFacingError(
            "We didn't see your funds arrive yet — card top-ups can take a few minutes. " +
              "Once your SOL lands you can buy straight from your wallet balance.",
          );
        }

        // Keep the gas reserve; swap the rest of what just arrived into the asset.
        const current = await connection.getBalance(owner);
        const reserve = APPLE_PAY_GAS_RESERVE;
        const fundedDelta = Math.max(0, current - baseline);
        const keepFromFunded = Math.max(0, reserve - baseline);
        const spendLamports = fundedDelta - keepFromFunded;
        if (spendLamports <= 0) {
          throw new UserFacingError("That's too small after the gas reserve — try a bit more.");
        }
        const spendUsd = (spendLamports / LAMPORTS_PER_SOL) * price * 0.99;

        const sol: WalletAsset = {
          mint: SOL_MINT,
          symbol: "SOL",
          decimals: 9,
          amount: BigInt(current),
          uiAmount: current / LAMPORTS_PER_SOL,
          usdValue: (current / LAMPORTS_PER_SOL) * price,
          chain: "solana",
        };

        setStatus("buying");
        return await depositWith(sol, spendUsd);
      } catch (e) {
        console.error("Apple Pay buy failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [connection, walletAddress, fundWallet, depositWith],
  );

  return {
    buyWithApplePay,
    status,
    busy: status !== "idle",
    label: status === "idle" ? null : LABELS[status],
    error,
  };
}
