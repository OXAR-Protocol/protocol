"use client";

import { useEffect, useRef, useState } from "react";

/** Anything under this and the eye can't see the difference — settle and stop. */
const EPSILON = 0.0005;

/**
 * A number that walks to its new value instead of jumping there.
 *
 * Balances change in steps that have nothing to do with how they're read: a
 * refresh lands, a position settles, and the figure snaps from one amount to
 * another. Money that jumps looks like money that was wrong a second ago. Easing
 * the last stretch — quickly, over a few frames — makes the same update read as
 * the total moving rather than being corrected.
 *
 * The live yield tick is already smooth (it recomputes every 50ms), so this is
 * for the discontinuities around it. First value is adopted outright: an opening
 * balance shouldn't count up from zero like a slot machine.
 */
export function useSmoothNumber(target: number, durationMs = 420): number {
  const [display, setDisplay] = useState(target);
  const from = useRef(target);
  const startedAt = useRef<number | null>(null);
  const frame = useRef(0);
  const seeded = useRef(false);

  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      from.current = target;
      setDisplay(target);
      return;
    }
    if (Math.abs(target - from.current) < EPSILON) return;

    const start = from.current;
    startedAt.current = null;

    const step = (now: number) => {
      if (startedAt.current === null) startedAt.current = now;
      const t = Math.min(1, (now - startedAt.current) / durationMs);
      // Ease-out cubic: most of the distance early, so it reads as arriving rather
      // than drifting.
      const eased = 1 - Math.pow(1 - t, 3);
      const value = start + (target - start) * eased;
      from.current = value;
      setDisplay(value);
      if (t < 1) frame.current = requestAnimationFrame(step);
      else from.current = target;
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [target, durationMs]);

  return display;
}
