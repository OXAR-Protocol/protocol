"use client";

import { useCallback, useState } from "react";
import { useFundWallet } from "@privy-io/react-auth/solana";
import type { Connection, PublicKey } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import { toFriendlyError, UserFacingError } from "@/lib/yield";
import { SOL_MINT, SOL_FEE_RESERVE, type WalletAsset } from "@/lib/portfolio/assets";

export type FundBuyStatus = "idle" | "funding" | "arriving" | "buying";

const LABELS: Record<Exclude<FundBuyStatus, "idle">, string> = {
  funding: "Opening Apple Pay…",
  arriving: "Waiting for your funds…",
  buying: "Buying…",
};

const LAMPORTS_PER_SOL = 1_000_000_000;
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
 * Funding SOL (not USDC) means the wallet ALSO ends up with the SOL it needs to
 * pay for the buy transaction — so it works end-to-end even on a brand-new, empty
 * wallet, with no gas sponsorship / backend. The deposit path already reserves
 * `SOL_FEE_RESERVE` for fees + token-account rent. Non-custodial throughout: the
 * on-ramp provider is the regulated merchant.
 */
export function useFundAndBuy(providerId: string) {
  const { connection, walletAddress } = useSolanaContext();
  const { fundWallet } = useFundWallet();
  const { depositWith } = useUniversalDeposit(providerId);
  const [status, setStatus] = useState<FundBuyStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const buyWithApplePay = useCallback(
    async (usdAmount: number): Promise<bigint> => {
      if (!walletAddress) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return BigInt(0);
      const owner = walletAddress;

      setError(null);
      try {
        const solPrice = await getSolPrice();
        if (solPrice <= 0) throw new UserFacingError("Couldn't price SOL — try again");

        const baseline = await connection.getBalance(owner);

        setStatus("funding");
        await fundWallet({
          address: owner.toBase58(),
          options: {
            asset: "native-currency", // buy SOL → covers the buy's own gas, no sponsorship needed
            amount: usdAmount.toFixed(2),
            defaultFundingMethod: "card", // card flow surfaces Apple Pay on supported devices
          },
        });

        // Card top-ups settle a beat after the modal closes — wait for the SOL to
        // land. The on-ramp delivers net-of-fee, so accept any clear arrival
        // (floor at half the requested USD worth of SOL to avoid dust false-positives).
        setStatus("arriving");
        const expectedLamports = Math.floor((usdAmount * 0.5 / solPrice) * LAMPORTS_PER_SOL);
        const arrived = await pollSolArrival(connection, owner, baseline, expectedLamports);
        if (!arrived) {
          throw new UserFacingError(
            "We didn't see your funds arrive yet — card top-ups can take a few minutes. " +
              "Once your SOL lands you can buy straight from your wallet balance.",
          );
        }

        // Keep ~SOL_FEE_RESERVE for gas; swap the rest of what just arrived into the
        // asset. Only touch the newly-funded SOL (don't spend the user's prior SOL
        // beyond topping the reserve), and pass USD slightly under the spendable cap.
        const current = await connection.getBalance(owner);
        const reserve = Number(SOL_FEE_RESERVE);
        const fundedDelta = Math.max(0, current - baseline);
        const keepFromFunded = Math.max(0, reserve - baseline);
        const spendLamports = fundedDelta - keepFromFunded;
        if (spendLamports <= 0) {
          throw new UserFacingError("That's too small after the gas reserve — try a bit more.");
        }
        const spendUsd = (spendLamports / LAMPORTS_PER_SOL) * solPrice * 0.99;

        const sol: WalletAsset = {
          mint: SOL_MINT,
          symbol: "SOL",
          decimals: 9,
          amount: BigInt(current),
          uiAmount: current / LAMPORTS_PER_SOL,
          usdValue: (current / LAMPORTS_PER_SOL) * solPrice,
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
