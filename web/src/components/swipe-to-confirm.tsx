"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import { ChevronsRight, Loader2 } from "lucide-react";

/**
 * The last gesture before money moves.
 *
 * A button is one tap, and one tap is what a thumb does by accident while
 * scrolling a page of numbers. A swipe cannot happen by accident, and it costs
 * nothing to someone who meant it — which is the whole trade: friction where the
 * consequence is real, nowhere else.
 *
 * Falls back to a plain click for keyboards and screen readers: the guard is
 * against a slip, not against people who navigate differently.
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
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [done, setDone] = useState(false);

  const KNOB = 52;
  const locked = !!disabled || !!busy || done;

  const settle = () => {
    const width = trackRef.current?.offsetWidth ?? 0;
    const travel = Math.max(0, width - KNOB - 8);
    // Two thirds of the way is a decision; less is a slip, and it springs back.
    if (x.get() >= travel * 0.66) {
      setDone(true);
      x.set(travel);
      onConfirm();
    } else {
      x.set(0);
    }
  };

  return (
    <div
      ref={trackRef}
      className={`relative mt-3 h-[60px] w-full overflow-hidden rounded-full border border-black/12 bg-black/[0.03] ${
        locked ? "opacity-60" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => !locked && onConfirm()}
        disabled={locked}
        className="absolute inset-0 flex items-center justify-center text-[14px] lowercase tracking-wide text-black/55"
      >
        {busy ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            {busyLabel ?? label}
          </span>
        ) : (
          label
        )}
      </button>

      {!locked && (
        <motion.div
          drag="x"
          dragConstraints={trackRef}
          dragElastic={0}
          dragMomentum={false}
          style={{ x }}
          onDragEnd={settle}
          className="absolute left-1 top-1 flex h-[52px] w-[52px] cursor-grab items-center justify-center rounded-full bg-black text-white active:cursor-grabbing"
        >
          <ChevronsRight size={18} strokeWidth={2} />
        </motion.div>
      )}
    </div>
  );
}
