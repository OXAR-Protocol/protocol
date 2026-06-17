"use client";

import { useCallback, useState } from "react";
import { useFundWallet } from "@privy-io/react-auth/solana";

import { useSolanaContext } from "@/providers/solana-provider";
import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import { readUsdcBase, pollUsdcArrival } from "@/lib/bridge/arrival";
import { USDC_MINT, USDC_DECIMALS } from "@/lib/constants";
import { toFriendlyError, UserFacingError } from "@/lib/yield";
import { type WalletAsset } from "@/lib/portfolio/assets";

export type FundBuyStatus = "idle" | "funding" | "arriving" | "buying";

const LABELS: Record<Exclude<FundBuyStatus, "idle">, string> = {
  funding: "Opening Apple Pay…",
  arriving: "Waiting for your funds…",
  buying: "Buying…",
};

/**
 * Buy ANY asset with Apple Pay (or card), via Privy's fiat on-ramp — works for
 * every provider because it reuses the universal deposit underneath:
 *
 *   Apple Pay → USDC lands in the user's own wallet (Privy funding) → existing
 *   deposit/swap into the chosen product (direct for USDC-yield, swap for
 *   Ondo/stocks/gold). No OXAR merchant account: the on-ramp provider is the
 *   regulated merchant; funds stay non-custodial.
 *
 * On-ramp settlement isn't instant, so we snapshot the USDC balance, open the
 * funding flow, then poll for the arriving USDC and buy with what actually lands
 * (net of the provider's fee).
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
        const baseline = await readUsdcBase(connection, owner, USDC_MINT);

        setStatus("funding");
        await fundWallet({
          address: owner.toBase58(),
          options: {
            asset: "USDC",
            amount: usdAmount.toFixed(2),
            defaultFundingMethod: "card", // card flow surfaces Apple Pay on supported devices
          },
        });

        // Card top-ups settle a little after the modal closes — wait for the USDC
        // to actually land. The on-ramp delivers net-of-fee, so accept any clear
        // arrival (floor at half the requested amount to avoid dust false-positives).
        setStatus("arriving");
        const expected = BigInt(Math.floor(usdAmount * 0.5 * 10 ** USDC_DECIMALS));
        const arrived = await pollUsdcArrival({
          connection,
          owner,
          mint: USDC_MINT,
          baseline,
          expected,
          timeoutMs: 10 * 60 * 1000,
        });
        if (!arrived) {
          throw new UserFacingError(
            "We didn't see your funds arrive yet — card top-ups can take a few minutes. " +
              "Once your USDC lands you can buy straight from your wallet balance.",
          );
        }

        // Buy with the USDC that actually arrived.
        const current = await readUsdcBase(connection, owner, USDC_MINT);
        const deltaBase = current > baseline ? current - baseline : BigInt(0);
        const deltaUi = Number(deltaBase) / 10 ** USDC_DECIMALS;
        const usdc: WalletAsset = {
          mint: USDC_MINT,
          symbol: "USDC",
          decimals: USDC_DECIMALS,
          amount: deltaBase,
          uiAmount: deltaUi,
          usdValue: deltaUi,
          chain: "solana",
        };

        setStatus("buying");
        return await depositWith(usdc, deltaUi);
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
