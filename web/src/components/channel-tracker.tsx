"use client";

import { useEffect, useRef } from "react";

import { useSolanaContext } from "@/providers/solana-provider";
import { trackChannel } from "@/lib/track";
import { CHANNEL_KEY } from "@/components/access-gate/invite";

const SENT_KEY = `${CHANNEL_KEY}.sent`;

/**
 * Once a wallet exists, attribute it to the invite code it arrived through (stored by
 * AccessWall in localStorage). Fires once per wallet; server dedups anyway. Null-render.
 */
export function ChannelReport() {
  const { walletAddress } = useSolanaContext();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !walletAddress) return;
    try {
      const src = window.localStorage.getItem(CHANNEL_KEY);
      if (!src) return;
      const addr = walletAddress.toBase58();
      if (window.localStorage.getItem(SENT_KEY) === addr) {
        done.current = true;
        return;
      }
      done.current = true;
      window.localStorage.setItem(SENT_KEY, addr);
      trackChannel(addr, src);
    } catch {
      /* ignore */
    }
  }, [walletAddress]);
  return null;
}
