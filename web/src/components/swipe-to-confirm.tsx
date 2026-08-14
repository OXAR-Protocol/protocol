"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

import { useIsNativeApp } from "@/hooks/use-native-app";
import { useT } from "@/lib/i18n";

/** How long the press has to last to count as a decision. */
const HOLD_MS = 800;

/**
 * The last gesture before money moves — and it isn't the same gesture everywhere.
 *
 * In the app it's a press and hold. A phone is held one-handed while walking, the
 * button sits under a thumb that has just been scrolling, and a tap is a millimetre
 * away from an accident; the hold costs a moment and collides with nothing (no
 * browser reserves a long press, and it works with a thumb, a mouse or a held
 * space bar). It replaced a swipe, which on iOS was the browser's own "go back"
 * gesture — the page left instead of confirming.
 *
 * On the web it's a click. A pointer doesn't slip, nothing scrolls under it, and
 * making someone hold a mouse button down for the better part of a second is a
 * ceremony that reads as a broken button, not as care. Same component, same words,
 * the gesture the device deserves.
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
  const hold = useIsNativeApp();
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
        className="mt-3 inline-flex h-[52px] w-full items-center justify-center rounded-full bg-black text-[14px] lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-30"
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
      className="relative mt-3 h-[60px] w-full select-none overflow-hidden rounded-full border border-black/12 bg-black/[0.03] text-[14px] lowercase tracking-wide text-black/60 transition disabled:opacity-40"
    >
      {/* The fill IS the timer — no separate spinner to read while deciding. */}
      <span
        aria-hidden
        style={{ width: `${progress * 100}%` }}
        className="absolute inset-y-0 left-0 bg-black/[0.07]"
      />
      {body}
    </button>
  );
}
