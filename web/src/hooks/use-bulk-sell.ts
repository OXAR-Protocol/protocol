"use client";

import { useCallback, useState } from "react";
import { Transaction } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { getProvider, toFriendlyError, isCancellation, toBaseUnits } from "@/lib/yield";
import { recordBasisDelta } from "@/lib/earnings/pending-basis";

export type BulkSellState = "idle" | "selling" | "done";

export interface BulkSellOutcome {
  /** Provider id. */
  id: string;
  ok: boolean;
  /** The user stopped it — not a failure, and it halts the rest of the run. */
  cancelled?: boolean;
  /** Friendly reason when it didn't go through. */
  error?: string;
}

export interface BulkSellTarget {
  id: string;
  /** Provider share balance, burned in full on a complete exit. */
  shares: bigint;
  /** Position value in USD — retires its cost basis on success. */
  valueUsd: number;
  /** USD to take out. Omitted or >= the position means a full exit. */
  amountUsd?: number;
}

/**
 * Exit several positions in one gesture.
 *
 * Each position is its own transaction — there is no batching across protocols,
 * and pretending otherwise would be a lie in the UI. So they run ONE AT A TIME:
 * a wallet prompts per signature, and firing them together would stack prompts
 * and race the same blockhash. A failure stops nothing else — the rest continue
 * and the caller is told exactly which ones didn't make it, because "some of your
 * sales failed" without saying which is useless to act on.
 */
export function useBulkSell() {
  const { wallet, connection, walletAddress } = useSolanaContext();
  const [state, setState] = useState<BulkSellState>("idle");
  /** Ids already attempted — drives per-row progress. */
  const [done, setDone] = useState<BulkSellOutcome[]>([]);

  const sellAll = useCallback(
    async (targets: readonly BulkSellTarget[]): Promise<BulkSellOutcome[]> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      setState("selling");
      setDone([]);
      const outcomes: BulkSellOutcome[] = [];

      for (const target of targets) {
        const provider = getProvider(target.id);
        try {
          if (!provider) throw new Error(`Unknown source: ${target.id}`);
          // A partial amount withdraws; anything at or above the position exits it
          // whole, so share-rounding can't strand the last cents.
          const partial =
            target.amountUsd !== undefined && target.amountUsd < target.valueUsd - 0.01;
          const tx = partial && provider.buildWithdrawTx
            ? await provider.buildWithdrawTx({
                owner: walletAddress,
                amount: toBaseUnits(target.amountUsd!.toFixed(6), provider.decimals),
                connection,
              })
            : provider.buildRedeemTx
            ? await provider.buildRedeemTx({ owner: walletAddress, connection })
            : provider.buildRedeemIxs
              ? new Transaction().add(
                  ...(await provider.buildRedeemIxs({
                    owner: walletAddress,
                    shares: target.shares,
                    connection,
                  })),
                )
              : null;
          if (!tx) throw new Error("This source does not support selling");

          const sig = await wallet.signAndSend(tx);
          await connection.confirmTransaction(sig, "confirmed");
          // The exited position's basis leaves with it, or a re-entry would be
          // measured against a stale one — see lib/earnings/pending-basis.
          const soldUsd = partial ? target.amountUsd! : target.valueUsd;
          if (soldUsd > 0) {
            recordBasisDelta(walletAddress.toBase58(), target.id, -soldUsd);
          }
          outcomes.push({ id: target.id, ok: true });
        } catch (e) {
          console.error(`Bulk sell failed for ${target.id}:`, e);
          const cancelled = isCancellation(e);
          outcomes.push({ id: target.id, ok: false, cancelled, error: toFriendlyError(e) });
          setDone([...outcomes]);
          // Turning one "no" into a prompt for every remaining position is nagging.
          if (cancelled) break;
          continue;
        }
        setDone([...outcomes]);
      }

      setState("done");
      return outcomes;
    },
    [wallet, walletAddress, connection],
  );

  const reset = useCallback(() => {
    setState("idle");
    setDone([]);
  }, []);

  return { sellAll, state, done, reset };
}
