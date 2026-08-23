"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Loader2 } from "lucide-react";

import { useHoldsToConfirm } from "@/hooks/use-holds-to-confirm";
import { DURATION, EASE_OUT } from "@/lib/motion";
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
  size = "sheet",
  onConfirm,
}: {
  /** What the act is — "sell", "buy $20". The hold prefix is added where it applies. */
  label: string;
  busyLabel?: string;
  busy?: boolean;
  disabled?: boolean;
  /** "sheet" is the tall control at the foot of a sheet; "bar" is the same gesture
   *  inside the picked-basket pill, where it has one row to live in. */
  size?: "sheet" | "bar";
  onConfirm: () => void;
}) {
  const { t } = useT();
  const hold = useHoldsToConfirm();
  // The fill is a motion value, not React state.
  //
  // It used to be `useState` written from inside the rAF loop and applied as
  // `width: ${progress * 100}%`, which bought two problems on the one interaction in
  // the app that must never stutter: a full React render on every frame of the hold,
  // and `width` — a layout property, so each of those frames also cost a relayout and
  // a repaint. Eight hundred milliseconds of that is roughly fifty of each.
  //
  // A motion value is written straight to the element, so nothing re-renders; `scaleX`
  // is composited, so nothing relayouts. Same fill, off the main thread's critical path.
  const fill = useMotionValue(0);
  // The full transform string rather than framer's `scaleX` shorthand — the shorthand
  // routes through a transform template on the main thread.
  const fillTransform = useTransform(fill, (v) => `scaleX(${v})`);
  const holding = useRef(false);
  const startedAt = useRef(0);
  const frame = useRef<number>(0);
  const locked = !!disabled || !!busy;

  const stop = () => {
    if (!holding.current) return;
    holding.current = false;
    cancelAnimationFrame(frame.current);
    // Let go halfway and the fill recedes rather than vanishing. Snapping it to zero
    // in one frame read as a glitch — as if the control had broken — when what
    // actually happened is that a decision was withdrawn. The hold is deliberate and
    // slow; the retreat is the system answering, so it is quick.
    animate(fill, 0, { duration: DURATION.press, ease: EASE_OUT });
  };

  const tick = (now: number) => {
    if (!holding.current) return;
    const done = Math.min(1, (now - startedAt.current) / HOLD_MS);
    fill.set(done);
    if (done >= 1) {
      holding.current = false;
      fill.set(0);
      // The moment money is authorised, felt in the hand. Absent on iOS Safari, which
      // does not implement it — so it is a bonus, never the confirmation itself.
      try {
        navigator.vibrate?.(12);
      } catch {
        // Some browsers throw on a gesture-less call. The confirm still happens.
      }
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

  // In the bar it IS the bar's own button: filled, one row tall, no top margin. The
  // sheet's control can be tall because it has a sheet to be tall in.
  const inBar = size === "bar";

  if (!hold) {
    return (
      <button
        type="button"
        disabled={locked}
        onClick={onConfirm}
        className={`inline-flex w-full items-center justify-center rounded-full bg-ink lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85 disabled:opacity-30 ${
          inBar ? "h-[38px] text-[13px]" : "mt-3 h-[52px] text-[14px]"
        }`}
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
      className={`relative w-full select-none overflow-hidden rounded-full lowercase tracking-wide transition disabled:opacity-40 ${
        inBar
          ? "h-[38px] bg-ink text-[13px] text-paper"
          : "mt-3 h-[60px] border border-ink/12 bg-ink/[0.03] text-[14px] text-ink/60"
      }`}
    >
      {/* The fill IS the timer — no separate spinner to read while deciding. It spans
          the whole control and is squeezed from the left, so the growing edge lands in
          the same place the old width animation put it. */}
      <motion.span
        aria-hidden
        style={{ transform: fillTransform, transformOrigin: "left" }}
        className={`absolute inset-0 ${inBar ? "bg-paper/25" : "bg-ink/[0.07]"}`}
      />
      {body}
    </button>
  );
}
