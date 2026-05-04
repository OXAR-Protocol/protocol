"use client";

import { useMemo } from "react";
import { generateGrowthCurve } from "@/lib/growth";
import { getBankRate } from "@/lib/bond-constants";

interface GrowthChartProps {
  amount: number;
  apy: number;
  denomination: string;
  color: string;
}

const W = 560;
const H = 180;
const PAD_X = 8;
const PAD_TOP = 20;
const PAD_BOTTOM = 28;
const CHART_H = H - PAD_TOP - PAD_BOTTOM;
const GRID_LINES = 4;
const MONTH_LABELS = ["0", "3", "6", "9", "12"];
const EPSILON = 0.01;

export function GrowthChart({ amount, apy, denomination, color }: GrowthChartProps) {
  const bankRate = getBankRate(denomination);

  const chart = useMemo(() => {
    const base = amount > 0 ? amount : 1000;
    const oxarData = generateGrowthCurve(base, apy);
    const bankData = generateGrowthCurve(base, bankRate);
    const allValues = [...oxarData, ...bankData];
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    const range = max - min + EPSILON;
    const yPos = (v: number) => PAD_TOP + CHART_H - ((v - min) / range) * CHART_H;
    const xPos = (i: number, len: number) => PAD_X + (i / (len - 1)) * (W - 2 * PAD_X);
    const toPoints = (data: number[]) =>
      data.map((v, i) => `${xPos(i, data.length)},${yPos(v)}`).join(" ");
    const toArea = (data: number[]) => {
      const path = data.map((v, i) => `${xPos(i, data.length)},${yPos(v)}`).join(" L");
      return `M${PAD_X},${H - PAD_BOTTOM} L${path} L${W - PAD_X},${H - PAD_BOTTOM} Z`;
    };
    const oxarEnd = oxarData[oxarData.length - 1];
    const bankEnd = bankData[bankData.length - 1];
    return {
      oxarPoints: toPoints(oxarData),
      bankPoints: toPoints(bankData),
      oxarArea: toArea(oxarData),
      oxarEndX: xPos(oxarData.length - 1, oxarData.length),
      oxarEndY: yPos(oxarEnd),
      oxarEnd,
      bankEnd,
      diff: oxarEnd - bankEnd,
    };
  }, [amount, apy, bankRate]);

  const gradId = useMemo(
    () => `growth-grad-${color.replace(/[^a-z0-9]/gi, "")}`,
    [color],
  );

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-[180px]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const y = PAD_TOP + (i / GRID_LINES) * CHART_H;
          return (
            <line
              key={i}
              x1={PAD_X}
              x2={W - PAD_X}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeDasharray="2 4"
            />
          );
        })}

        <path d={chart.oxarArea} fill={`url(#${gradId})`} />

        <polyline
          points={chart.bankPoints}
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.5"
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />

        <polyline
          points={chart.oxarPoints}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx={chart.oxarEndX} cy={chart.oxarEndY} r="3" fill={color} />

        {MONTH_LABELS.map((m, i) => {
          const x = PAD_X + (i / (MONTH_LABELS.length - 1)) * (W - 2 * PAD_X);
          return (
            <text
              key={m}
              x={x}
              y={H - 8}
              textAnchor="middle"
              fontSize="9"
              fontFamily="monospace"
              fill="rgba(255,255,255,0.25)"
            >
              {m}M
            </text>
          );
        })}
      </svg>

      <div className="flex items-center justify-between mt-2 font-mono text-[11px]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-white/40">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            OXAR ${Math.round(chart.oxarEnd).toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5 text-white/25">
            <span className="inline-block w-2 h-[1.5px] bg-white/25" />
            Bank ${Math.round(chart.bankEnd).toLocaleString()}
          </span>
        </div>
        {amount > 0 && (
          <span className="font-mono text-[11px]" style={{ color }}>
            +${Math.round(chart.diff).toLocaleString()} vs bank
          </span>
        )}
      </div>
    </div>
  );
}
