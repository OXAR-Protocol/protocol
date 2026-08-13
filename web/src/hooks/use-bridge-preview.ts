"use client";

import { useEffect, useState } from "react";

import { DELORA_SOLANA_CHAIN_ID, type BridgeQuote } from "@oxar/sdk";

import { useSolanaContext } from "@/providers/solana-provider";

export interface BridgePreview {
  /** What lands on the other chain, in that asset's units. Null while unknown. */
  outAmount: number | null;
  /** Roughly how long the bridge says it takes. */
  seconds: number | null;
  quoting: boolean;
}

const EMPTY: BridgePreview = { outAmount: null, seconds: null, quoting: false };

/**
 * What actually arrives on the other side, before anything is signed.
 *
 * Sending across chains costs a fee the bridge sets, and until now the only way to
 * find out was to send: the quote was fetched inside the transaction. Someone
 * moving $20 to Base deserves to know it lands as $19.40 while they can still
 * change their mind — the same reason the sell shows its payout.
 *
 * Debounced, because it fires on every keystroke of an amount.
 */
export function useBridgePreview({
  amountBase,
  decimals,
  originMint,
  destChainId,
  destMint,
  destDecimals,
  to,
  enabled,
}: {
  amountBase: bigint;
  decimals: number;
  originMint: string;
  destChainId?: number;
  destMint: string;
  destDecimals: number;
  to: string;
  enabled: boolean;
}): BridgePreview {
  const { walletAddress } = useSolanaContext();
  const [state, setState] = useState<BridgePreview>(EMPTY);
  const owner = walletAddress?.toBase58() ?? null;

  useEffect(() => {
    if (!enabled || !owner || !destChainId || amountBase <= BigInt(0) || !to) {
      setState(EMPTY);
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, quoting: true }));

    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/bridge-quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderAddress: owner,
            originChainId: DELORA_SOLANA_CHAIN_ID,
            destinationChainId: destChainId,
            amount: amountBase.toString(),
            originCurrency: originMint,
            destinationCurrency: destMint,
            receiverAddress: to,
          }),
        });
        if (!res.ok) throw new Error("no route");
        const quote = (await res.json()) as BridgeQuote;
        if (cancelled) return;
        setState({
          // The guaranteed minimum, not the optimistic figure: it's the number the
          // person can hold us to.
          outAmount: Number(quote.minOutputAmount) / 10 ** destDecimals,
          seconds: quote.estimatedTimeSec ?? null,
          quoting: false,
        });
      } catch {
        if (!cancelled) setState(EMPTY);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, owner, amountBase, originMint, destChainId, destMint, destDecimals, to, decimals]);

  return state;
}
