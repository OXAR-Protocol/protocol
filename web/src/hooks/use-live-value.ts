"use client";

import { useEffect, useRef, useState } from "react";

const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
// ~20fps — fast enough for the micro-digits to visibly tick, light on re-renders.
const TICK_MS = 50;

/**
 * Projects a balance growing continuously at `apy` forward from the moment the
 * snapshot was captured, ticking a few times a second so even a tiny position
 * shows live motion (the sub-cent digits move). Re-anchors whenever `snapshot`
 * changes — e.g. after a refetch — so it never drifts from the real on-chain value.
 *
 * Continuous compounding (`base · e^{rate·t}`) keeps it correct over a long idle
 * session; at these amounts it's indistinguishable from simple interest per tick.
 */
export function useLiveValue(snapshot: number, apy: number): number {
  const [value, setValue] = useState(snapshot);
  const anchor = useRef({ base: snapshot, at: 0 });

  useEffect(() => {
    anchor.current = { base: snapshot, at: performance.now() };
    setValue(snapshot);
    if (snapshot <= 0 || apy <= 0) return;

    const ratePerSec = apy / SECONDS_PER_YEAR;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (now - last < TICK_MS) return;
      last = now;
      const elapsed = (now - anchor.current.at) / 1000;
      setValue(anchor.current.base * Math.exp(ratePerSec * elapsed));
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [snapshot, apy]);

  return value;
}
