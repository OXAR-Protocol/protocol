"use client";

import { useCallback, useState } from "react";
import { Transaction } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { getProvider, toFriendlyError, isCancellation, toBaseUnits } from "@/lib/yield";
import { recordBasisDelta } from "@/lib/earnings/pending-basis";

export type BulkTradeState = "idle" | "running" | "done";

export interface BulkTradeOutcome {
  /** Provider id. */
  id: string;
  ok: boolean;
  /** The user stopped it — not a failure, and it halts the rest of the run. */
  cancelled?: boolean;
  /** Friendly reason when it didn't go through. */
  error?: string;
}

/** One leg of a run. Buying and selling differ only in the transaction built. */
export type BulkTradeJob =
  | {
      kind: "sell";
      id: string;
      /** Provider share balance, burned in full on a complete exit. */
      shares: bigint;
      /** Position value in USD — a full exit retires this much cost basis. */
      valueUsd: number;
      /** USD to take out. Omitted or >= the position means a full exit. */
      amountUsd?: number;
    }
  | { kind: "buy"; id: string; amountUsd: number };

/**
 * Buy or sell several assets in one gesture.
 *
 * Each asset is its own transaction — there is no batching across protocols,
 * and pretending otherwise would be a lie in the UI. So they run ONE AT A TIME:
 * a wallet prompts per signature, and firing them together would stack prompts
 * and race the same blockhash. A failure stops nothing else — the rest continue
 * and the caller is told exactly which ones didn't make it, because "some of your
 * sales failed" without saying which is useless to act on.
 */
export function useBulkTrade() {
  const { wallet, connection, walletAddress } = useSolanaContext();
  const [state, setState] = useState<BulkTradeState>("idle");
  /** Ids already attempted — drives per-row progress. */
  const [done, setDone] = useState<BulkTradeOutcome[]>([]);

  const run = useCallback(
    async (jobs: readonly BulkTradeJob[]): Promise<BulkTradeOutcome[]> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      setState("running");
      setDone([]);
      const outcomes: BulkTradeOutcome[] = [];

      for (const job of jobs) {
        const provider = getProvider(job.id);
        try {
          if (!provider) throw new Error(`Unknown source: ${job.id}`);

          // Buying and selling share this whole loop; only the transaction differs.
          let tx;
          let basisDelta: number;
          if (job.kind === "buy") {
            const amount = toBaseUnits(job.amountUsd.toFixed(6), provider.decimals);
            tx = provider.buildDepositTx
              ? await provider.buildDepositTx({ owner: walletAddress, amount, connection })
              : provider.buildDepositIxs
                ? new Transaction().add(
                    ...(await provider.buildDepositIxs({ owner: walletAddress, amount, connection })),
                  )
                : null;
            if (!tx) throw new Error("This source does not support buying");
            basisDelta = job.amountUsd;
          } else {
            // A partial amount withdraws; at or above the position it exits whole, so
            // share-rounding can't strand the last cents.
            const partial = job.amountUsd !== undefined && job.amountUsd < job.valueUsd - 0.01;
            tx = partial && provider.buildWithdrawTx
              ? await provider.buildWithdrawTx({
                  owner: walletAddress,
                  amount: toBaseUnits(job.amountUsd!.toFixed(6), provider.decimals),
                  connection,
                })
              : provider.buildRedeemTx
                ? await provider.buildRedeemTx({ owner: walletAddress, connection })
                : provider.buildRedeemIxs
                  ? new Transaction().add(
                      ...(await provider.buildRedeemIxs({
                        owner: walletAddress,
                        shares: job.shares,
                        connection,
                      })),
                    )
                  : null;
            if (!tx) throw new Error("This source does not support selling");
            basisDelta = -(partial ? job.amountUsd! : job.valueUsd);
          }

          const sig = await wallet.signAndSend(tx);
          await connection.confirmTransaction(sig, "confirmed");
          // Cost basis moves with the trade in both directions, or the earnings view
          // reads a fresh buy as profit / a re-entry against a stale exit.
          if (basisDelta !== 0) {
            recordBasisDelta(walletAddress.toBase58(), job.id, basisDelta);
          }
          outcomes.push({ id: job.id, ok: true });
        } catch (e) {
          console.error(`Bulk ${job.kind} failed for ${job.id}:`, e);
          const cancelled = isCancellation(e);
          outcomes.push({ id: job.id, ok: false, cancelled, error: toFriendlyError(e) });
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

  return { run, state, done, reset };
}
