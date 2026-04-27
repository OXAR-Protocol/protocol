"use client";

import { useEffect } from "react";

import { useWarp } from "./warp-transition";

const ENTRY_WARP_DURATION = 3000;
// If a warp completed within this window, suppress the entry warp to avoid
// back-to-back warps (e.g., landing → /login already played one).
const RECENT_WARP_WINDOW_MS = 10_000;

/**
 * Plays the warp animation once when this component mounts. Used inside
 * (app)/layout to greet users on hard load / new tab / after gate unlock.
 * Does NOT fire on soft client-side navigation between app routes (the
 * layout stays mounted across them).
 */
export function WarpOnEntry() {
  const { startWarp } = useWarp();

  useEffect(() => {
    let last = 0;
    try {
      last = parseInt(
        window.sessionStorage.getItem("oxar_last_warp_at") ?? "0",
        10,
      );
    } catch {
      // sessionStorage unavailable — proceed with warp.
    }

    if (last && Date.now() - last < RECENT_WARP_WINDOW_MS) return;

    startWarp({ duration: ENTRY_WARP_DURATION });
  }, [startWarp]);

  return null;
}
