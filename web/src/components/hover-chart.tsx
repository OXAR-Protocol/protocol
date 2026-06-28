"use client";

import { useRef, useState } from "react";

import { Sparkline } from "@/components/sparkline";

interface Props {
  values: number[];
  /** Format the hovered value for the tooltip, e.g. (v) => `$${v.toFixed(2)}`. */
  format: (v: number) => string;
  height?: number;
  /** Tailwind text-color class — drives the line, fill, and the marker dot. */
  className?: string;
  fill?: boolean;
}

/**
 * Sparkline + hover read-out: move the cursor over the chart and a guide line,
 * a marker dot on the curve, and a tooltip with the value at that point follow
 * the pointer — the usual interactive-chart behaviour. The dot/guide are placed
 * with the SAME min→bottom / max→top mapping `sparklinePath` uses, so the marker
 * sits exactly on the line. Pointer-only (no tooltip on touch, by design).
 */
export function HoverChart({ values, format, height = 220, className, fill }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState<number | null>(null);

  const n = values.length;
  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el || n < 2) return;
    const rect = el.getBoundingClientRect();
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setI(Math.round(frac * (n - 1)));
  };

  const min = n > 0 ? Math.min(...values) : 0;
  const max = n > 0 ? Math.max(...values) : 0;
  const span = max - min;
  const leftPct = i !== null && n > 1 ? (i / (n - 1)) * 100 : 0;
  const topPct = i !== null ? (span === 0 ? 50 : (1 - (values[i] - min) / span) * 100) : 0;

  return (
    <div
      ref={ref}
      className={`relative w-full ${className ?? ""}`}
      style={{ height }}
      onMouseMove={onMove}
      onMouseLeave={() => setI(null)}
    >
      <Sparkline values={values} height={height} fill={fill} className="h-full w-full" />

      {i !== null && (
        <>
          <div
            className="pointer-events-none absolute top-0 bottom-0 w-px bg-black/15"
            style={{ left: `${leftPct}%` }}
          />
          <div
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current ring-2 ring-white"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          />
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[150%] whitespace-nowrap rounded-[6px] bg-black px-2 py-1 text-[11px] tabular-nums text-white"
            style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          >
            {format(values[i])}
          </div>
        </>
      )}
    </div>
  );
}
