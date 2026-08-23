"use client";

import { useEffect } from "react";

import { useAppReducedMotion } from "@/lib/motion";
import { useWarp } from "./warp-transition";

/** The first time this browser ever opens the app. It is a real moment and it gets
 *  the whole animation. */
const FIRST_WARP_DURATION = 3000;
/** Every time after that. Long enough to cover the auth and balance round-trips,
 *  short enough that nobody counts it. The full three seconds was being charged on
 *  every cold open — under the Capacitor shell, that is every launch — and a splash
 *  you have already seen is not a welcome, it is a wait. */
const RETURN_WARP_DURATION = 1200;
// If a warp completed within this window, suppress the entry warp to avoid
// back-to-back warps (e.g., landing → /login already played one).
const RECENT_WARP_WINDOW_MS = 10_000;
/** Set once the full-length warp has played, so it only ever plays once per browser. */
const SEEN_KEY = "oxar:warp-seen";

/**
 * Plays the warp animation once when this component mounts. Used inside
 * (app)/layout to greet users on hard load / new tab / after gate unlock.
 * Does NOT fire on soft client-side navigation between app routes (the
 * layout stays mounted across them).
 */
export function WarpOnEntry() {
  const { startWarp } = useWarp();
  const reduced = useAppReducedMotion();

  useEffect(() => {
    // Someone who asked their OS for less motion does not want a three-second
    // full-screen animation shortened — they want it not to happen.
    if (reduced) return;

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

    let seen = false;
    try {
      seen = !!window.localStorage.getItem(SEEN_KEY);
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage blocked (private mode): fall through to the short warp rather than
      // charging the full three seconds to someone we cannot remember.
      seen = true;
    }

    startWarp({ duration: seen ? RETURN_WARP_DURATION : FIRST_WARP_DURATION });
  }, [startWarp, reduced]);

  return null;
}
