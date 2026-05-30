"use client";

import { sparklinePath } from "@/lib/yield";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
}

/** Tiny dependency-free SVG line chart. Inherits color via `currentColor`. */
export function Sparkline({ values, width = 240, height = 36, className }: Props) {
  const d = sparklinePath(values, width, height);
  if (!d) return null;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      fill="none"
      className={className}
      aria-hidden
    >
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
