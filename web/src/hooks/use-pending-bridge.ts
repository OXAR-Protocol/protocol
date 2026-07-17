"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { USDC_MINT } from "@/lib/constants";
import { loadPending, loadAllPending, savePending, clearPending, PENDING_EVENT, type PendingBridge } from "@/lib/bridge/pending";
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
  const [pending, setPending] = useState<PendingBridge | null>(() => loadPending());
  // How many bridges are queued in total (head + waiting) — surfaced so a user who
  // fired several concurrent cross-chain deposits sees they're all tracked.
  const [queued, setQueued] = useState<number>(() => loadAllPending().length);
  const [resuming, setResuming] = useState(false);
  // Bridged funds have LANDED but an external wallet still owes a signature for the
  // buy — surface a tap instead of a background sign (which hangs: the wallet's
  // signing popup won't reliably appear when fired from a background timer).
  const [arrived, setArrived] = useState(false);
  // originTxHash currently being polled — guards against double-processing.
  const processingRef = useRef<string | null>(null);
  const { deposit } = useYieldActions(pending?.providerId ?? "");

  // Funds arrived but the deposit/swap didn't complete → surface, never strand.
  const failed = (pending?.attempts ?? 0) > 0;

  // Re-read the queue → show the current head (next in-flight bridge) + total count.
  // Used after every mutation so finishing one bridge advances to the next instead of
  // hiding the banner (the old single-record code did setPending(null)).
  const syncFromStore = useCallback(() => {
    setPending(loadPending());
    setQueued(loadAllPending().length);
  }, []);

  // Claim the record, then deposit/swap the bridged funds into the chosen asset.
  // Shared by the silent auto-path (embedded) and the tap-to-finish path (external).
  const runDeposit = useCallback(
    async (rec: PendingBridge) => {
      setResuming(true);
      clearPending(rec.originTxHash); // claim THIS bridge so a parallel tab can't double-deposit
      try {
        await deposit(BigInt(rec.expectedUsdc));
        setArrived(false);
        syncFromStore(); // advance to the next queued bridge (banner hides only when the queue empties)
      } catch (e) {
        // Signed step failed/rejected AFTER arrival — re-queue as failed (goes to the
        // tail, so it doesn't block other in-flight bridges) so the banner shows Retry,
        // never silently stranding the funds (they sit as the bridged token).
        console.error("Pending bridge deposit failed; funds are safe in the wallet:", e);
        savePending({ ...rec, attempts: (rec.attempts ?? 0) + 1 });
        setArrived(false);
        syncFromStore();
      } finally {
        setResuming(false);
      }
    },
    [deposit, syncFromStore],
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
  const attempts = pending?.attempts ?? 0;
  useEffect(() => {
    if (!txHash || !hasWallet) return;
    // Wait until the wallet can actually sign — the background watcher can race
    // wallet load, and depositing against the read-only fallback throws "connect
    // your wallet". Gating here avoids a spurious failure; it retries when ready.
    if (!canSign) return;
    // A prior auto-attempt failed → wait for a manual Retry (don't loop a swap that
    // just failed). Funds are safe in the wallet as the bridged token meanwhile.
    if (attempts > 0) return;
    // Already landed and waiting for the user's tap (external) — don't re-poll.
    if (arrived) return;
    if (processingRef.current === txHash) return;
    processingRef.current = txHash;
    let stale = false;
    (async () => {
      try {
        const rec = loadPending();
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
        const cur = loadPending();
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
  }, [txHash, hasWallet, canSign, attempts, arrived]);

  const dismiss = useCallback(() => {
    clearPending(pending?.originTxHash); // stop watching THIS bridge; the next (if any) shows
    setArrived(false);
    processingRef.current = null;
    syncFromStore();
  }, [pending, syncFromStore]);

  // External wallet: the user taps to sign the buy now that the funds have arrived —
  // this runs in a user gesture, so the wallet's signing popup reliably appears.
  const finish = useCallback(() => {
    const rec = loadPending();
    if (!rec) return;
    void runDeposit(rec);
  }, [runDeposit]);

  // Re-arm a failed deposit for another try (funds already sit in the wallet).
  const retry = useCallback(() => {
    const rec = loadPending();
    if (!rec) return;
    processingRef.current = null;
    setArrived(false);
    savePending({ ...rec, attempts: 0 });
  }, []);

  return { pending, queued, resuming, failed, arrived, dismiss, finish, retry };
}
