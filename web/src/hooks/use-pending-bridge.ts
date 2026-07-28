"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { USDC_MINT } from "@/lib/constants";
import { rescaleAllocations } from "@oxar/sdk";

import { useBulkTrade } from "@/hooks/use-bulk-trade";
import {
  loadActivePending,
  loadAllPending,
  narrowPlan,
  loadStuckPending,
  countPending,
  savePending,
  clearPending,
  promotePending,
  PENDING_EVENT,
  type PendingBridge,
} from "@/lib/bridge/pending";
import { pollUsdcArrival } from "@/lib/bridge/arrival";

/**
 * Global watcher for a cross-chain deposit in flight. Mounted app-wide, it picks
 * up a pending record the moment a bridge tx is submitted (same-tab PENDING_EVENT)
 * or on a reload/focus, polls the Solana side for arrival, and finishes the
 * deposit in the background — so the user is never trapped on a spinner and funds
 * are never lost. Pre-multi-asset records had no `mint` → default to USDC.
 *
 * If the final deposit/swap fails AFTER the bridged funds arrive, we DON'T clear
 * the record — we mark it failed so the banner surfaces it with a Retry, instead
 * of silently stranding the funds (they sit safely in the wallet as the bridged
 * token, and can be deposited/swapped manually).
 */
export function usePendingBridge() {
  const { connection, walletAddress, canSign, isExternal } = useSolanaContext();
  // The bridge being polled/deposited right now — the first one that hasn't failed.
  const [pending, setPending] = useState<PendingBridge | null>(() => loadActivePending());
  // A bridge whose funds landed but whose deposit failed. Tracked SEPARATELY from
  // `pending` on purpose: it's waiting for a human, and it used to hide every bridge
  // behind it (nothing polled, nothing shown) simply by sitting at the head.
  const [stuck, setStuck] = useState<PendingBridge | null>(() => loadStuckPending());
  // Moving vs. waiting-for-a-human, so the banner can name both instead of one.
  const [counts, setCounts] = useState(() => countPending());
  const [resuming, setResuming] = useState(false);
  // Bridged funds have LANDED but an external wallet still owes a signature for the
  // buy — surface a tap instead of a background sign (which hangs: the wallet's
  // signing popup won't reliably appear when fired from a background timer).
  const [arrived, setArrived] = useState(false);
  // originTxHash currently being polled — guards against double-processing.
  const processingRef = useRef<string | null>(null);
  // Re-arms the watcher after a Retry: the record keeps its hash, so nothing in the
  // effect's deps would otherwise change and it would never poll again.
  const [rearm, setRearm] = useState(0);
  const { deposit } = useYieldActions(pending?.providerId ?? "");
  // A bridged BASKET buys several assets from one arrival; each is its own
  // transaction, which is exactly what this already does for an on-page basket.
  const bulk = useBulkTrade();

  // Re-read the queue → the bridge to work, the one that needs a hand, and the counts.
  // Used after every mutation so finishing one bridge advances to the next instead of
  // hiding the banner (the old single-record code did setPending(null)).
  const syncFromStore = useCallback(() => {
    setPending(loadActivePending());
    setStuck(loadStuckPending());
    setCounts(countPending());
  }, []);

  // Claim the record, then deposit/swap the bridged funds into the chosen asset.
  // Shared by the silent auto-path (embedded) and the tap-to-finish path (external).
  /**
   * Buy a bridged basket, one asset at a time, shrinking the stored plan as each
   * one lands.
   *
   * The record is NOT claimed up front the way a single deposit is. Clearing it
   * first would mean a basket that dies halfway leaves nothing behind, and the
   * bridged dollars sit in the wallet with no record of what they were for. So the
   * plan survives and loses a leg only once that leg has actually gone through —
   * a reload, a crash or a retry can then only ever buy what is still owed.
   *
   * Each leg re-reads the record before spending, so a second tab working the same
   * basket skips what this one already did.
   */
  const runBasket = useCallback(
    async (rec: PendingBridge) => {
      // What actually arrived, in dollars. The plan was written against what was
      // ASKED for, and a bridge delivers a little less — see `rescaleAllocations`.
      const arrivedUsd = Number(BigInt(rec.expectedUsdc)) / 1e6;
      const asked = Object.fromEntries((rec.plan ?? []).map((l) => [l.providerId, l.amountUsd]));
      const scaled = rescaleAllocations(asked, arrivedUsd);

      for (const leg of rec.plan ?? []) {
        const amountUsd = scaled[leg.providerId];
        if (!amountUsd || amountUsd <= 0) continue;
        const current = loadAllPending().find((r) => r.originTxHash === rec.originTxHash);
        const stillOwed = current?.plan ?? [];
        if (!stillOwed.some((l) => l.providerId === leg.providerId)) continue;

        const [outcome] = await bulk.run([{ kind: "buy", id: leg.providerId, amountUsd }]);
        if (!outcome?.ok) throw new Error(outcome?.error ?? "Purchase failed");
        narrowPlan(
          rec.originTxHash,
          stillOwed.filter((l) => l.providerId !== leg.providerId),
        );
      }
    },
    [bulk],
  );

  const runDeposit = useCallback(
    async (rec: PendingBridge) => {
      setResuming(true);
      // A basket keeps its record until its legs are done (see runBasket); a single
      // deposit claims it up front so a parallel tab can't repeat it.
      if (!rec.plan?.length) clearPending(rec.originTxHash);
      try {
        if (rec.plan?.length) await runBasket(rec);
        else await deposit(BigInt(rec.expectedUsdc));
        setArrived(false);
        syncFromStore(); // advance to the next queued bridge (banner hides only when the queue empties)
      } catch (e) {
        // Signed step failed/rejected AFTER arrival — re-queue as failed (goes to the
        // tail, so it doesn't block other in-flight bridges) so the banner shows Retry,
        // never silently stranding the funds (they sit as the bridged token).
        console.error("Pending bridge deposit failed; funds are safe in the wallet:", e);
        // Re-read before re-queueing: a basket may have completed some legs, and
        // writing back the record we started with would resurrect them.
        const latest = loadAllPending().find((r) => r.originTxHash === rec.originTxHash) ?? rec;
        savePending({ ...latest, attempts: (latest.attempts ?? 0) + 1 });
        setArrived(false);
        syncFromStore();
      } finally {
        setResuming(false);
      }
    },
    [deposit, runBasket, syncFromStore],
  );

  // Pick up newly-saved / cleared records (same tab) and on tab focus.
  useEffect(() => {
    window.addEventListener(PENDING_EVENT, syncFromStore);
    window.addEventListener("focus", syncFromStore);
    return () => {
      window.removeEventListener(PENDING_EVENT, syncFromStore);
      window.removeEventListener("focus", syncFromStore);
    };
  }, [syncFromStore]);

  // Read the volatile bits through refs so the arrival poll (below) isn't torn down
  // and restarted on every render. Privy re-creates the wallet/connection objects
  // across renders, which would otherwise churn `deposit` → cancel the in-flight
  // poll mid-way (the arrival is then never caught, and the banner sticks forever).
  const connRef = useRef(connection);
  const ownerRef = useRef(walletAddress);
  const isExternalRef = useRef(isExternal);
  const runDepositRef = useRef(runDeposit);
  connRef.current = connection;
  ownerRef.current = walletAddress;
  isExternalRef.current = isExternal;
  runDepositRef.current = runDeposit;

  // Background: poll the Solana side (read-only — no signing) until the bridged
  // funds land. On arrival, embedded wallets deposit silently; external wallets
  // wait for the user's tap (see `arrived` / `finish`). Deps are primitives only,
  // so render churn can't restart (and thereby cancel) an in-flight poll.
  const txHash = pending?.originTxHash ?? null;
  const hasWallet = !!walletAddress;
  useEffect(() => {
    if (!txHash || !hasWallet) return;
    // Wait until the wallet can actually sign — the background watcher can race
    // wallet load, and depositing against the read-only fallback throws "connect
    // your wallet". Gating here avoids a spurious failure; it retries when ready.
    if (!canSign) return;
    // Already landed and waiting for the user's tap (external) — don't re-poll.
    if (arrived) return;
    if (processingRef.current === txHash) return;
    processingRef.current = txHash;
    let stale = false;
    (async () => {
      try {
        // Re-read rather than closing over `pending`: a failed record that just went
        // to the tail must not be picked up again here.
        const rec = loadActivePending();
        if (!rec) {
          setPending(null);
          return;
        }
        const baseline = BigInt(rec.baselineUsdc);
        const expected = BigInt(rec.expectedUsdc);
        const mint = rec.mint ?? USDC_MINT;
        const ok = await pollUsdcArrival({ connection: connRef.current, owner: ownerRef.current!, mint, baseline, expected });
        if (stale) return;
        if (!ok) {
          processingRef.current = null; // timed out without arrival — retry on next visit
          return;
        }
        const cur = loadActivePending();
        if (!cur) {
          setPending(null);
          return;
        }
        // External wallet: the buy needs the user's own signature, which a background
        // sign can't surface reliably — flip to "arrived" and let the banner offer a
        // one-tap finish. Embedded wallet: deposit right away (sponsored, silent).
        if (isExternalRef.current) {
          setArrived(true);
          return;
        }
        await runDepositRef.current(cur);
      } catch (e) {
        console.error("Pending bridge resume failed:", e);
        processingRef.current = null;
      }
    })();
    return () => {
      stale = true;
    };
  }, [txHash, hasWallet, canSign, arrived, rearm]);

  /** Stop watching one bridge (by hash). The rest of the queue keeps going. */
  const dismiss = useCallback(
    (originTxHash?: string) => {
      clearPending(originTxHash);
      setArrived(false);
      processingRef.current = null;
      syncFromStore();
    },
    [syncFromStore],
  );

  // External wallet: the user taps to sign the buy now that the funds have arrived —
  // this runs in a user gesture, so the wallet's signing popup reliably appears.
  const finish = useCallback(() => {
    const rec = loadActivePending();
    if (!rec) return;
    void runDeposit(rec);
  }, [runDeposit]);

  // Re-arm a failed deposit for another try (funds already sit in the wallet). It's
  // promoted to the head so "Retry" means now, not after the others drain.
  const retry = useCallback(() => {
    const rec = loadStuckPending();
    if (!rec) return;
    processingRef.current = null;
    setArrived(false);
    savePending({ ...rec, attempts: 0 });
    promotePending(rec.originTxHash);
    setRearm((n) => n + 1);
    syncFromStore();
  }, [syncFromStore]);

  return { pending, stuck, counts, resuming, arrived, dismiss, finish, retry };
}
