"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { USDC_MINT } from "@/lib/constants";
import { loadPending, savePending, clearPending, PENDING_EVENT, type PendingBridge } from "@/lib/bridge/pending";
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

  // Claim the record, then deposit/swap the bridged funds into the chosen asset.
  // Shared by the silent auto-path (embedded) and the tap-to-finish path (external).
  const runDeposit = useCallback(
    async (rec: PendingBridge) => {
      setResuming(true);
      clearPending(); // claim so a parallel tab can't double-deposit
      try {
        await deposit(BigInt(rec.expectedUsdc));
        setPending(null); // done — bought the asset the user picked
        setArrived(false);
      } catch (e) {
        // Signed step failed/rejected AFTER arrival — re-arm as failed so the banner
        // shows Retry, never silently strand the funds (they sit as the bridged token).
        console.error("Pending bridge deposit failed; funds are safe in the wallet:", e);
        savePending({ ...rec, attempts: (rec.attempts ?? 0) + 1 });
        setArrived(false);
      } finally {
        setResuming(false);
      }
    },
    [deposit],
  );

  // Pick up newly-saved / cleared records (same tab) and on tab focus.
  useEffect(() => {
    const sync = () => setPending(loadPending());
    window.addEventListener(PENDING_EVENT, sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener(PENDING_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  // Background: poll the Solana side (read-only — no signing) until the bridged
  // funds land. On arrival, embedded wallets deposit silently; external wallets
  // wait for the user's tap (see `arrived` / `finish`).
  useEffect(() => {
    if (!pending || !walletAddress) return;
    // Wait until the wallet can actually sign — the background watcher can race
    // wallet load, and depositing against the read-only fallback throws "connect
    // your wallet". Gating here avoids a spurious failure; it retries when ready.
    if (!canSign) return;
    // A prior auto-attempt failed → wait for a manual Retry (don't loop a swap that
    // just failed). Funds are safe in the wallet as the bridged token meanwhile.
    if ((pending.attempts ?? 0) > 0) return;
    // Already landed and waiting for the user's tap (external) — don't re-poll.
    if (arrived) return;
    if (processingRef.current === pending.originTxHash) return;
    processingRef.current = pending.originTxHash;
    let cancelled = false;
    (async () => {
      try {
        const baseline = BigInt(pending.baselineUsdc);
        const expected = BigInt(pending.expectedUsdc);
        const mint = pending.mint ?? USDC_MINT;
        const ok = await pollUsdcArrival({ connection, owner: walletAddress, mint, baseline, expected });
        if (cancelled) return;
        if (!ok) {
          processingRef.current = null; // timed out without arrival — retry on next visit
          return;
        }
        const rec = loadPending();
        if (!rec) {
          setPending(null);
          return;
        }
        // External wallet: the buy needs the user's own signature, which a background
        // sign can't surface reliably — flip to "arrived" and let the banner offer a
        // one-tap finish. Embedded wallet: deposit right away (sponsored, silent).
        if (isExternal) {
          setArrived(true);
          return;
        }
        await runDeposit(rec);
      } catch (e) {
        console.error("Pending bridge resume failed:", e);
        processingRef.current = null;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pending, walletAddress, canSign, isExternal, arrived, connection, runDeposit]);

  const dismiss = useCallback(() => {
    clearPending();
    setPending(null);
    setArrived(false);
    processingRef.current = null;
  }, []);

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

  return { pending, resuming, failed, arrived, dismiss, finish, retry };
}
