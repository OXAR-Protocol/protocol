"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";

import { clearCache } from "@/lib/cache";

/**
 * Pull down at the top of the page to reload — the gesture every phone app has.
 *
 * The browser has its own version of this, but the app is mostly opened from a home
 * screen or inside another app's webview, where it is turned off. So the page keeps
 * the browser's version where it exists (`overscroll-behavior` is left alone) and
 * this only ever runs once the page is ALREADY at the top and the finger is still
 * moving down — the two can't both claim the same gesture, because the browser's
 * fires from the overscroll this one deliberately does not create.
 *
 * It reloads rather than re-fetching in place. Half the screen refreshed and half
 * not is the failure people can't see, and this is money: a whole reload is slower
 * and always honest. Caches are cleared first so the reload can't be served the
 * numbers the pull was meant to replace.
 */

/** How far the finger must travel before letting go does anything. */
const TRIGGER_PX = 72;
/** The pull is damped past this, so it feels attached rather than elastic. */
const MAX_PULL_PX = 96;

export function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<number | null>(null);
  // The handlers need to READ how far the pull got without making the state updater
  // do work — an updater that calls another setState is not a pure function of the
  // previous value, and React is entitled to run it twice.
  const pullRef = useRef(0);
  const setPullBoth = (v: number) => {
    pullRef.current = v;
    setPull(v);
  };

  useEffect(() => {
    const atTop = () => window.scrollY <= 0;

    const onStart = (e: TouchEvent) => {
      // One finger, at the top, and not inside something that scrolls on its own —
      // a sheet, or the sideways-scrolling filter chips.
      if (e.touches.length !== 1 || !atTop()) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-no-pull]")) return;
      start.current = e.touches[0]!.clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (start.current === null || refreshing) return;
      const dy = e.touches[0]!.clientY - start.current;
      // Scrolled back up into the page, or the finger went the other way: hand the
      // gesture back rather than fighting it.
      if (dy <= 0 || !atTop()) {
        start.current = null;
        setPullBoth(0);
        return;
      }
      // Square-root damping: the first pixels answer immediately, the last ones
      // resist, which is what makes a pull feel like it's attached to something.
      setPullBoth(Math.min(MAX_PULL_PX, Math.sqrt(dy) * 7));
    };

    const onEnd = () => {
      if (start.current === null) return;
      start.current = null;
      if (pullRef.current < TRIGGER_PX) {
        setPullBoth(0);
        return;
      }
      setPullBoth(TRIGGER_PX);
      setRefreshing(true);
      // Cleared first, so the reload can't be served the numbers the pull was
      // meant to replace.
      clearCache();
      // Let the spinner paint before the thread goes away.
      setTimeout(() => window.location.reload(), 150);
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [refreshing]);

  if (pull <= 0 && !refreshing) return null;

  const ready = pull >= TRIGGER_PX;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center"
      style={{ transform: `translateY(${pull * 0.6}px)` }}
    >
      <span
        className={`mt-2 flex h-8 w-8 items-center justify-center rounded-full border bg-white/90 backdrop-blur transition-colors ${
          ready || refreshing ? "border-black/20 text-black" : "border-black/10 text-black/35"
        }`}
      >
        <RefreshCw
          size={14}
          strokeWidth={2}
          className={refreshing ? "animate-spin" : undefined}
          style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
        />
      </span>
    </div>
  );
}
