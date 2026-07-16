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
  const { connection, walletAddress, canSign } = useSolanaContext();
  const [pending, setPending] = useState<PendingBridge | null>(() => loadPending());
  const [resuming, setResuming] = useState(false);
  // originTxHash currently being polled — guards against double-processing.
  const processingRef = useRef<string | null>(null);
  const { deposit } = useYieldActions(pending?.providerId ?? "");

  // Funds arrived but the deposit/swap didn't complete → surface, never strand.
  const failed = (pending?.attempts ?? 0) > 0;

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

  useEffect(() => {
    if (!pending || !walletAddress) return;
    // Wait until the wallet can actually sign — the background watcher can race
    // wallet load, and depositing against the read-only fallback throws "connect
    // your wallet". Gating here avoids a spurious failure; it retries when ready.
    if (!canSign) return;
    // A prior auto-attempt failed → wait for a manual Retry (don't loop a swap that
    // just failed). Funds are safe in the wallet as the bridged token meanwhile.
    if ((pending.attempts ?? 0) > 0) return;
    if (processingRef.current === pending.originTxHash) return;
    processingRef.current = pending.originTxHash;
    let cancelled = false;
    (async () => {
      setResuming(true);
      try {
        const baseline = BigInt(pending.baselineUsdc);
        const expected = BigInt(pending.expectedUsdc);
        const mint = pending.mint ?? USDC_MINT;
        const arrived = await pollUsdcArrival({ connection, owner: walletAddress, mint, baseline, expected });
        if (cancelled) return;
        if (!arrived) {
          processingRef.current = null; // timed out without arrival — retry on next visit
          return;
        }
        // Funds landed. Claim (so a parallel tab can't double-deposit), then deposit.
        const rec = loadPending();
        if (!rec) {
          setPending(null);
          return;
        }
        clearPending();
        try {
          await deposit(expected);
          setPending(null); // done
        } catch (e) {
          // Deposit/swap failed AFTER arrival — re-arm as "failed" so the banner
          // shows it + a Retry, instead of clearing and stranding the funds.
          console.error("Pending bridge deposit failed; funds are safe in the wallet:", e);
          savePending({ ...rec, attempts: (rec.attempts ?? 0) + 1 });
          // keep processingRef set → no instant re-loop; user retries manually.
        }
      } catch (e) {
        console.error("Pending bridge resume failed:", e);
        processingRef.current = null;
      } finally {
        if (!cancelled) setResuming(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pending, walletAddress, canSign, connection, deposit]);

  const dismiss = useCallback(() => {
    clearPending();
    setPending(null);
    processingRef.current = null;
  }, []);

  // Re-arm a failed deposit for another try (funds already sit in the wallet).
  const retry = useCallback(() => {
    const rec = loadPending();
    if (!rec) return;
    processingRef.current = null;
    savePending({ ...rec, attempts: 0 });
  }, []);

  return { pending, resuming, failed, dismiss, retry };
}
