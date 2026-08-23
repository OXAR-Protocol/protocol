"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { RefreshCw } from "lucide-react";

import { clearCache } from "@/lib/cache";
import { SPRING } from "@/lib/motion";

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
  // The distance lives in a motion value, not in React state.
  //
  // As state it was written on every `touchmove` — so the whole subtree reconciled
  // once per frame of the pull, to move one 32px circle. A motion value writes the
  // transform straight to the node and never renders. What IS state is the two things
  // that genuinely change the tree: whether the indicator exists, and whether it has
  // crossed the threshold. Both change at most twice per gesture.
  const pull = useMotionValue(0);
  const indicatorY = useTransform(pull, (v) => `translateY(${v * 0.6}px)`);
  const iconRotate = useTransform(pull, (v) => `rotate(${v * 3}deg)`);

  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef<number | null>(null);
  // Mirrors of the two flags, so the passive listeners can read the current value
  // without being re-registered every time one of them flips.
  const visibleRef = useRef(false);
  const readyRef = useRef(false);

  useEffect(() => {
    const atTop = () => window.scrollY <= 0;

    /** Move the indicator, and flip the two flags only when they actually change. */
    const setPull = (v: number) => {
      pull.set(v);
      const nowVisible = v > 0;
      const nowReady = v >= TRIGGER_PX;
      if (nowVisible !== visibleRef.current) {
        visibleRef.current = nowVisible;
        setVisible(nowVisible);
      }
      if (nowReady !== readyRef.current) {
        readyRef.current = nowReady;
        setReady(nowReady);
      }
    };

    /** Give the pull back with a spring instead of deleting it.
     *
     *  Setting the distance to zero snapped the indicator home in a single frame,
     *  which reads as the gesture having failed rather than as having been let go of.
     *  A pull that felt attached to something on the way down should feel attached on
     *  the way back. */
    const release = () => {
      animate(pull, 0, { ...SPRING.sheet, restDelta: 0.5 }).then(() => {
        if (pull.get() !== 0) return;
        visibleRef.current = false;
        readyRef.current = false;
        setVisible(false);
        setReady(false);
      });
    };

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
        release();
        return;
      }
      // Square-root damping: the first pixels answer immediately, the last ones
      // resist, which is what makes a pull feel like it's attached to something.
      setPull(Math.min(MAX_PULL_PX, Math.sqrt(dy) * 7));
    };

    const onEnd = () => {
      if (start.current === null) return;
      start.current = null;
      if (pull.get() < TRIGGER_PX) {
        release();
        return;
      }
      setPull(TRIGGER_PX);
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
  }, [refreshing, pull]);

  if (!visible && !refreshing) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex justify-center"
      style={{ transform: indicatorY }}
    >
      <span
        className={`mt-2 flex h-8 w-8 items-center justify-center rounded-full border bg-paper/90 backdrop-blur transition-colors ${
          ready || refreshing ? "border-ink/20 text-ink" : "border-ink/10 text-ink/35"
        }`}
      >
        <motion.span style={refreshing ? undefined : { transform: iconRotate }}>
          <RefreshCw
            size={14}
            strokeWidth={2}
            className={refreshing ? "animate-spin" : undefined}
          />
        </motion.span>
      </span>
    </motion.div>
  );
}
