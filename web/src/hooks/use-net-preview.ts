"use client";

import { useEffect, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { toBaseUnits } from "@/lib/yield";
import { getSwapQuote } from "@/lib/swap/jupiter-swap";
import { buildQuoteRequest, networkToChainId, bridgeFeeUsd } from "@/lib/bridge/delora";
import type { WalletAsset } from "@/lib/portfolio/assets";

export interface NetPreview {
  kind: "direct" | "swap" | "bridge";
  /** Guaranteed-min USDC the deposit will receive, in display units. */
  netUsdc: number | null;
  quoting: boolean;
  feeUsd?: number;
  etaSec?: number;
}

const payBaseFor = (asset: WalletAsset, usd: number) => {
  const price = asset.usdValue / asset.uiAmount;
  return toBaseUnits((usd / price).toFixed(asset.decimals), asset.decimals);
};

/**
 * Live "you'll deposit ~$X" preview for the selected pay-asset: direct (full
 * amount), Jupiter swap (min-out), or Delora bridge (min-out + fee + ETA).
 * Debounced; cancels in-flight quotes on change.
 */
export function useNetPreview(params: {
  payAsset: WalletAsset | null;
  usdAmount: number;
  productMint: string;
  productDecimals: number;
  evmAddress: string | null;
}): NetPreview {
  const { payAsset, usdAmount, productMint, productDecimals, evmAddress } = params;
  const { walletAddress } = useSolanaContext();
  const isDirect = payAsset?.chain === "solana" && payAsset.mint === productMint;
  const kind: NetPreview["kind"] = !payAsset
    ? "direct"
    : payAsset.chain === "ethereum"
      ? "bridge"
      : isDirect
        ? "direct"
        : "swap";

  const [state, setState] = useState<Omit<NetPreview, "kind">>({ netUsdc: null, quoting: false });

  useEffect(() => {
    if (!payAsset || usdAmount <= 0) {
      setState({ netUsdc: null, quoting: false });
      return;
    }
    if (isDirect) {
      setState({ netUsdc: usdAmount, quoting: false });
      return;
    }
    let cancelled = false;
    setState((s) => ({ ...s, quoting: true }));
    const t = setTimeout(async () => {
      try {
        if (payAsset.chain === "ethereum") {
          const originChainId = payAsset.network ? networkToChainId(payAsset.network) : null;
          if (!originChainId || !walletAddress) throw new Error("no route");
          const req = buildQuoteRequest({
            senderAddress: evmAddress ?? "0x0000000000000000000000000000000000000000",
            originChainId,
            amount: payBaseFor(payAsset, usdAmount),
            originCurrency: payAsset.mint,
            receiverAddress: walletAddress.toBase58(),
            destinationMint: productMint,
          });
          const res = await fetch("/api/bridge-quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(req),
          });
          const q = await res.json();
          if (!res.ok) throw new Error(q?.error || "no route");
          if (!cancelled) {
            setState({
              netUsdc: Number(q.minOutputAmount) / 10 ** productDecimals,
              quoting: false,
              feeUsd: bridgeFeeUsd(q),
              etaSec: q.estimatedTimeSec,
            });
          }
        } else {
          const q = await getSwapQuote({
            inputMint: payAsset.mint,
            outputMint: productMint,
            amount: payBaseFor(payAsset, usdAmount),
          });
          if (!cancelled) setState({ netUsdc: Number(q.otherAmountThreshold) / 10 ** productDecimals, quoting: false });
        }
      } catch {
        if (!cancelled) setState({ netUsdc: null, quoting: false });
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [payAsset, usdAmount, isDirect, productMint, productDecimals, evmAddress, walletAddress]);

  return { kind, ...state };
}
