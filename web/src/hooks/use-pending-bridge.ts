"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { USDC_MINT } from "@/lib/constants";
import { loadPending, clearPending, PENDING_EVENT, type PendingBridge } from "@/lib/bridge/pending";
import { pollUsdcArrival } from "@/lib/bridge/arrival";

/**
 * Global watcher for a cross-chain deposit in flight. Mounted app-wide, it picks
 * up a pending record the moment a bridge tx is submitted (same-tab PENDING_EVENT)
 * or on a reload/focus, polls the Solana side for arrival, and finishes the
 * deposit in the background — so the user is never trapped on a spinner and funds
 * are never lost. Pre-multi-asset records had no `mint` → default to USDC.
 */
export function usePendingBridge() {
  const { connection, walletAddress } = useSolanaContext();
  const [pending, setPending] = useState<PendingBridge | null>(() => loadPending());
  const [resuming, setResuming] = useState(false);
  // originTxHash currently being polled — guards against double-processing.
  const processingRef = useRef<string | null>(null);
  const { deposit } = useYieldActions(pending?.providerId ?? "");

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
        if (arrived) {
          // Claim before depositing so another tab / reload can't double-deposit.
          if (!loadPending()) {
            setPending(null);
            return;
          }
          clearPending();
          await deposit(expected);
          setPending(null);
        } else {
          // Timed out without arrival — let the next focus/visit retry.
          processingRef.current = null;
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
  }, [pending, walletAddress, connection, deposit]);

  const dismiss = useCallback(() => {
    clearPending();
    setPending(null);
    processingRef.current = null;
  }, []);

  return { pending, resuming, dismiss };
}
