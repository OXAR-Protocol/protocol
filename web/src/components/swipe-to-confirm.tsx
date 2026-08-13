"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

/** How long the press has to last to count as a decision. */
const HOLD_MS = 800;

/**
 * The last gesture before money moves: press and hold.
 *
 * It was a swipe first, and a swipe was wrong on the web. A horizontal drag that
 * starts near the left edge is the browser's own "go back" gesture — on iOS the
 * page navigated away instead of confirming, which is the worst possible outcome
 * for a control whose whole job is deliberateness.
 *
 * Holding costs the same intent and collides with nothing: no browser reserves a
 * long press, and it works identically with a mouse, a thumb and a keyboard
 * (space or enter held down). Let go early and the fill drains back — nothing
 * happens, which is what a slip should do.
 */
export function SwipeToConfirm({
  label,
  busyLabel,
  busy,
  disabled,
  onConfirm,
}: {
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const holding = useRef(false);
  const startedAt = useRef(0);
  const frame = useRef<number>(0);
  const locked = !!disabled || !!busy;

  const stop = () => {
    holding.current = false;
    cancelAnimationFrame(frame.current);
    setProgress(0);
  };

  const tick = (now: number) => {
    if (!holding.current) return;
    const done = Math.min(1, (now - startedAt.current) / HOLD_MS);
    setProgress(done);
    if (done >= 1) {
      holding.current = false;
      setProgress(0);
      onConfirm();
      return;
    }
    frame.current = requestAnimationFrame(tick);
  };

  const start = () => {
    if (locked || holding.current) return;
    holding.current = true;
    // rAF hands the same clock to the callback, so the start mark comes from there
    // too — one time source, and nothing reads the clock during a render.
    startedAt.current = 0;
    frame.current = requestAnimationFrame((now) => {
      startedAt.current = now;
      tick(now);
    });
  };

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <button
      type="button"
      disabled={locked}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") start();
      }}
      onKeyUp={stop}
      // Stops the browser treating the press as the start of a scroll or a
      // double-tap zoom, which made the fill stutter on a phone.
      style={{ touchAction: "manipulation" }}
      className="relative mt-3 h-[60px] w-full select-none overflow-hidden rounded-full border border-black/12 bg-black/[0.03] text-[14px] lowercase tracking-wide text-black/60 transition disabled:opacity-40"
    >
      {/* The fill IS the timer — no separate spinner to read while deciding. */}
      <span
        aria-hidden
        style={{ width: `${progress * 100}%` }}
        className="absolute inset-y-0 left-0 bg-black/[0.07]"
      />
      <span className="relative inline-flex items-center gap-2">
        {busy ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            {busyLabel ?? label}
          </>
        ) : (
          label
        )}
      </span>
    </button>
  );
}
