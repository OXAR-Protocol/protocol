"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { useHoldsToConfirm } from "@/hooks/use-holds-to-confirm";
import { useT } from "@/lib/i18n";

/** How long the press has to last to count as a decision. */
const HOLD_MS = 800;

/**
 * The last gesture before money moves — and it isn't the same gesture everywhere.
 *
 * Under a thumb it's a press and hold. The phone is held one-handed, the button sits
 * under a finger that has just been scrolling, and a tap is a millimetre from an
 * accident; the hold costs a moment and collides with nothing (no browser reserves a
 * long press). It replaced a swipe, which on iOS was the browser's own "go back"
 * gesture — the page left instead of confirming.
 *
 * Under a mouse it's a click. A pointer doesn't slip, nothing scrolls under it, and
 * making someone hold a button down for most of a second reads as broken rather than
 * careful. Same component, same words — `useHoldsToConfirm` decides which, by input
 * rather than by screen size or by which app is showing the page.
 */
export function SwipeToConfirm({
  label,
  busyLabel,
  busy,
  disabled,
  onConfirm,
}: {
  /** What the act is — "sell", "buy $20". The hold prefix is added where it applies. */
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const { t } = useT();
  const hold = useHoldsToConfirm();
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

  const body = (
    <span className="relative inline-flex items-center gap-2">
      {busy ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          {busyLabel ?? label}
        </>
      ) : (
        hold ? t("confirm.hold", { verb: label }) : label
      )}
    </span>
  );

  if (!hold) {
    return (
      <button
        type="button"
        disabled={locked}
        onClick={onConfirm}
        className="mt-3 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-ink text-[14px] lowercase tracking-wide text-paper transition hover:bg-ink/85 disabled:opacity-30"
      >
        {body}
      </button>
    );
  }

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
      className="relative mt-3 h-[60px] w-full select-none overflow-hidden rounded-full border border-ink/12 bg-ink/[0.03] text-[14px] lowercase tracking-wide text-ink/60 transition disabled:opacity-40"
    >
      {/* The fill IS the timer — no separate spinner to read while deciding. */}
      <span
        aria-hidden
        style={{ width: `${progress * 100}%` }}
        className="absolute inset-y-0 left-0 bg-ink/[0.07]"
      />
      {body}
    </button>
  );
}
