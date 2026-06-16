"use client";

import { useId } from "react";

import { sparklinePath } from "@/lib/yield";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  /** Soft gradient area fill under the line (Ondo-style). Default off. */
  fill?: boolean;
}

/** Tiny dependency-free SVG line chart. Inherits color via `currentColor`. */
export function Sparkline({ values, width = 240, height = 36, className, fill = false }: Props) {
  const d = sparklinePath(values, width, height);
  const gid = useId().replace(/:/g, "");
  if (!d) return null;
  const areaD = `${d} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      fill="none"
      className={className}
      aria-hidden
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity={0.18} />
              <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#${gid})`} stroke="none" />
        </>
      )}
      <path
        d={d}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
