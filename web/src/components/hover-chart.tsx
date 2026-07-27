"use client";

import { useRef, useState } from "react";

import { Sparkline } from "@/components/sparkline";

interface Props {
  values: number[];
  /** Format the read-out value, e.g. (v) => `$${v.toFixed(2)}`. */
  format: (v: number) => string;
  height?: number;
  /** Tailwind text-color class — drives the line, fill, and the marker dot. */
  className?: string;
  fill?: boolean;
}

/**
 * Sparkline + a smooth scrub read-out. A vertical crosshair, a dot on the curve,
 * and a value tooltip follow the pointer CONTINUOUSLY — the cursor's exact x is
 * used (not snapped to a data index), and both the dot's height and the shown
 * value are linearly interpolated between the two neighbouring points, so it
 * glides without the big jumps you get from sparse data. Same min→bottom /
 * max→top mapping as `sparklinePath`, so the dot rides exactly on the line.
 *
 * Pointer-based, so it works for mouse hover AND touch: tap or drag on mobile
 * scrubs the chart (touch-action pan-y keeps vertical page scroll working). On
 * touch the read-out stays after lifting; for mouse it clears on leave.
 */
export function HoverChart({ values, format, height = 220, className, fill }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Cursor x as a 0..1 fraction of the width. null = no active read-out.
  const [frac, setFrac] = useState<number | null>(null);

  const n = values.length;
  const update = (clientX: number) => {
    const el = ref.current;
    if (!el || n < 2) return;
    const rect = el.getBoundingClientRect();
    setFrac(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)));
  };

  const min = n > 0 ? Math.min(...values) : 0;
  const max = n > 0 ? Math.max(...values) : 0;
  const span = max - min;

  let leftPct = 0;
  let topPct = 0;
  let value = 0;
  if (frac !== null && n > 1) {
    const pos = frac * (n - 1);
    const idx = Math.min(n - 2, Math.floor(pos));
    const t = pos - idx;
    value = values[idx] + (values[idx + 1] - values[idx]) * t; // interpolated
    leftPct = frac * 100;
    topPct = span === 0 ? 50 : (1 - (value - min) / span) * 100;
  }

  // Keep the tooltip on-screen: shift its anchor near the edges, flip it below
  // the dot when there's no room above.
  const tx = leftPct < 12 ? "0%" : leftPct > 88 ? "-100%" : "-50%";
  const ty = topPct > 18 ? "-150%" : "60%";

  return (
    <div
      ref={ref}
      className={`relative w-full touch-pan-y select-none cursor-crosshair ${className ?? ""}`}
      style={{ height }}
      onPointerDown={(e) => {
        ref.current?.setPointerCapture?.(e.pointerId);
        update(e.clientX);
      }}
      onPointerMove={(e) => update(e.clientX)}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setFrac(null);
      }}
    >
      <Sparkline values={values} height={height} fill={fill} className="h-full w-full" />

      {frac !== null && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 w-px bg-black/25"
            style={{ left: `${leftPct}%` }}
          />
          <div
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-white"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          />
          <div
            className="pointer-events-none absolute whitespace-nowrap rounded-[6px] bg-black px-2 py-1 text-[11px] tabular-nums text-white"
            style={{ left: `${leftPct}%`, top: `${topPct}%`, transform: `translate(${tx}, ${ty})` }}
          >
            {format(value)}
          </div>
        </>
      )}
    </div>
  );
}
