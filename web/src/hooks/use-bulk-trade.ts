"use client";

import { useCallback, useMemo, useState } from "react";
import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { useFeature } from "@/hooks/use-features";
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


/** The transaction for one leg, and what it does to cost basis. Pulled out of the
 *  run loop so the one-at-a-time path and the single-signature path build the
 *  same way — two builders would drift, and the drift would be money. */
async function buildJob(
  job: BulkTradeJob,
  owner: PublicKey,
  connection: Connection,
): Promise<{ tx: Transaction | VersionedTransaction; basisDelta: number }> {
  const provider = getProvider(job.id);
  if (!provider) throw new Error(`Unknown source: ${job.id}`);

  if (job.kind === "buy") {
    const amount = toBaseUnits(job.amountUsd.toFixed(6), provider.decimals);
    const tx = provider.buildDepositTx
      ? await provider.buildDepositTx({ owner, amount, connection })
      : provider.buildDepositIxs
        ? new Transaction().add(...(await provider.buildDepositIxs({ owner, amount, connection })))
        : null;
    if (!tx) throw new Error("This source does not support buying");
    return { tx, basisDelta: job.amountUsd };
  }

  // A partial amount withdraws; at or above the position it exits whole, so
  // share-rounding can't strand the last cents.
  const partial = job.amountUsd !== undefined && job.amountUsd < job.valueUsd - 0.01;
  const tx = partial && provider.buildWithdrawTx
    ? await provider.buildWithdrawTx({
        owner,
        amount: toBaseUnits(job.amountUsd!.toFixed(6), provider.decimals),
        connection,
      })
    : provider.buildRedeemTx
      ? await provider.buildRedeemTx({ owner, connection })
      : provider.buildRedeemIxs
        ? new Transaction().add(
            ...(await provider.buildRedeemIxs({ owner, shares: job.shares, connection })),
          )
        : null;
  if (!tx) throw new Error("This source does not support selling");
  return { tx, basisDelta: -(partial ? job.amountUsd! : job.valueUsd) };
}

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
  // Dark until it has carried real money: a basket signed as one is the money path,
  // and the fallback below is the behaviour everyone has today.
  const oneSignature = useFeature("bulk-one-signature");
  const [state, setState] = useState<BulkTradeState>("idle");
  /** Ids already attempted — drives per-row progress. */
  const [done, setDone] = useState<BulkTradeOutcome[]>([]);

  const run = useCallback(
    async (jobs: readonly BulkTradeJob[]): Promise<BulkTradeOutcome[]> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      setState("running");
      setDone([]);
      const outcomes: BulkTradeOutcome[] = [];

      // ONE PROMPT when the wallet can do it: build everything first, sign the lot,
      // then broadcast. Privy's `signTransaction(...inputs)` returns one signed
      // transaction per input behind a single confirmation — five assets used to mean
      // five prompts, which is where people gave up.
      //
      // The trade-off moves rather than disappears: a refusal now costs the whole
      // basket instead of the rest of it, and a send can still fail after the
      // signature. Both are reported per row, as before.
      if (oneSignature && wallet.signAllRaw && jobs.length > 1) {
        const built: { job: BulkTradeJob; tx: Transaction | VersionedTransaction; basisDelta: number }[] = [];
        for (const job of jobs) {
          try {
            const b = await buildJob(job, walletAddress, connection);
            built.push({ job, ...b });
          } catch (e) {
            console.error(`Bulk ${job.kind} build failed for ${job.id}:`, e);
            outcomes.push({ id: job.id, ok: false, error: toFriendlyError(e) });
            setDone([...outcomes]);
          }
        }

        if (built.length) {
          let signed: Uint8Array[];
          try {
            signed = await wallet.signAllRaw(built.map((b) => b.tx));
          } catch (e) {
            console.error("Bulk signing failed:", e);
            const cancelled = isCancellation(e);
            for (const b of built) {
              outcomes.push({ id: b.job.id, ok: false, cancelled, error: toFriendlyError(e) });
            }
            setDone([...outcomes]);
            setState("done");
            return outcomes;
          }

          // Sent one after another rather than all at once: they are separate
          // transactions on the same wallet, and firing them together races the
          // same blockhash the way the old loop was careful not to.
          for (let i = 0; i < built.length; i++) {
            const { job, basisDelta } = built[i]!;
            try {
              const sig = await connection.sendRawTransaction(signed[i]!);
              await connection.confirmTransaction(sig, "confirmed");
              if (basisDelta !== 0) {
                recordBasisDelta(walletAddress.toBase58(), job.id, basisDelta);
              }
              outcomes.push({ id: job.id, ok: true });
            } catch (e) {
              console.error(`Bulk ${job.kind} send failed for ${job.id}:`, e);
              outcomes.push({ id: job.id, ok: false, error: toFriendlyError(e) });
            }
            setDone([...outcomes]);
          }
        }

        setState("done");
        return outcomes;
      }

      for (const job of jobs) {
        try {
          const { tx, basisDelta } = await buildJob(job, walletAddress, connection);
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
    [wallet, walletAddress, connection, oneSignature],
  );

  const reset = useCallback(() => {
    setState("idle");
    setDone([]);
  }, []);

  // The same outcomes keyed by id, so a per-asset view can show each result beside
  // its own row instead of everyone reading one shared line at the bottom.
  const results = useMemo(
    () => Object.fromEntries(done.map((d) => [d.id, d])) as Record<string, BulkTradeOutcome>,
    [done],
  );

  return { run, state, done, results, reset };
}
