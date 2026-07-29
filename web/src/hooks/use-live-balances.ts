"use client";

import { useEffect, useRef } from "react";

import { useSolanaContext } from "@/providers/solana-provider";

/** Wait this long after a transaction lands before re-reading. One buy can produce
 *  several notifications, and the indexers we read need a moment to agree. */
const SETTLE_MS = 1_500;

/**
 * Refresh the screen when the wallet's money actually moves, instead of on a reload.
 *
 * A `logsSubscribe` filtered to the owner is one long-lived connection that fires on
 * every transaction the wallet takes part in — including ones made elsewhere, and
 * including a first-ever buy that creates a token account we weren't watching yet.
 * Subscribing to each known token account instead would have missed exactly that case.
 *
 * It costs almost nothing: a subscription is not polling, and Helius bills streaming
 * by volume (a notification is a few hundred bytes) rather than by request. Standard
 * Solana WebSocket methods are on the free plan, so this needed no upgrade — which is
 * the opposite of what I first assumed.
 *
 * The socket is a TRIGGER, never a second source of truth: it calls the same loaders
 * the page already uses. A websocket that computed balances its own way would be a
 * second opinion about the user's money, and the two would eventually disagree.
 */
export function useLiveBalances(onChange: () => void): void {
  const { connection, walletAddress } = useSolanaContext();

  // Read the callback through a ref so a re-created `onChange` (they usually are,
  // every render) can't tear down and re-open the socket underneath us.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const owner = walletAddress?.toBase58() ?? null;

  useEffect(() => {
    if (!owner || !walletAddress) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let subId: number | null = null;

    const settle = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!cancelled) onChangeRef.current();
      }, SETTLE_MS);
    };

    try {
      subId = connection.onLogs(walletAddress, settle, "confirmed");
    } catch (e) {
      // Some endpoints refuse a filtered log subscription. Losing live updates is a
      // missing convenience, not a broken page — it stays as it was before.
      console.warn("Live balance updates unavailable:", e);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      if (subId !== null) {
        // Fire-and-forget: an unsubscribe that fails on a socket already closing is
        // not worth surfacing, and throwing here would break unmount.
        connection.removeOnLogsListener(subId).catch(() => {});
      }
    };
    // `connection` is stable for a session; `owner` is the real dependency. Adding the
    // connection object would reopen the socket on every Privy re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [owner]);
}
