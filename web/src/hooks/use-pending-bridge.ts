"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { USDC_MINT } from "@/lib/constants";
import { loadPending, clearPending, type PendingBridge } from "@/lib/bridge/pending";
// loadPending is re-checked before depositing to avoid a double-deposit race.
import { pollUsdcArrival } from "@/lib/bridge/arrival";

/**
 * Recovery for an interrupted cross-chain deposit. On mount, if a bridge was
 * left in flight (page closed before the USDC landed), resume polling the
 * Solana side and deposit once the funds arrive. Funds are never lost — at worst
 * they sit as USDC in the wallet and we finish the deposit on the next visit.
 */
export function usePendingBridge() {
  const { connection, walletAddress } = useSolanaContext();
  const [pending, setPending] = useState<PendingBridge | null>(() => loadPending());
  const [resuming, setResuming] = useState(false);
  const startedRef = useRef(false);
  const { deposit } = useYieldActions(pending?.providerId ?? "");

  useEffect(() => {
    if (!pending || !walletAddress || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      setResuming(true);
      try {
        const baseline = BigInt(pending.baselineUsdc);
        const expected = BigInt(pending.expectedUsdc);
        const arrived = await pollUsdcArrival({ connection, owner: walletAddress, mint: USDC_MINT, baseline, expected });
        if (arrived) {
          // Claim before depositing so the live flow / another tab can't double-deposit.
          if (!loadPending()) {
            setPending(null);
            return;
          }
          clearPending();
          await deposit(expected);
          setPending(null);
        }
      } catch (e) {
        console.error("Pending bridge resume failed:", e);
      } finally {
        setResuming(false);
      }
    })();
  }, [pending, walletAddress, connection, deposit]);

  const dismiss = useCallback(() => {
    clearPending();
    setPending(null);
  }, []);

  return { pending, resuming, dismiss };
}
