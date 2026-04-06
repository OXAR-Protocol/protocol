"use client";

import { useRef, useState, useCallback } from "react";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";
import { YieldCalculator } from "@/components/yield-calculator";

// Fake sparkline data — gentle upward curves
const SPARKLINES = [
  [20, 22, 21, 25, 28, 27, 32, 35, 38, 40, 42, 48, 52, 55, 60, 65, 68, 72, 78, 82, 88, 92, 95, 100],
  [30, 32, 31, 33, 35, 34, 36, 38, 40, 41, 43, 45, 48, 50, 52, 55, 58, 60, 63, 66, 70, 74, 78, 82],
  [35, 36, 35, 37, 38, 37, 39, 40, 42, 43, 44, 46, 48, 50, 52, 54, 56, 58, 60, 63, 66, 69, 72, 75],
];

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const h = 60;
  const w = 200;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${x},${y}`;
    })
    .join(" ");

  // Area fill path
  const areaPath = `M0,${h} L${data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / (max - min)) * h;
      return `${x},${y}`;
    })
    .join(" L")} L${w},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[60px]" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#grad-${color.replace(/[^a-z0-9]/gi, "")})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const VAULTS = [
  {
    name: "Government Bonds UAH",
    apy: "18",
    currency: "UAH",
    term: "3-12 months",
    bankRate: "3%",
    sparkline: SPARKLINES[0],
    color: "rgba(114,162,240,1)",
  },
  {
    name: "Government Bonds USD",
    apy: "4",
    currency: "USD",
    term: "Stable",
    bankRate: "0.5%",
    sparkline: SPARKLINES[1],
    color: "rgba(139,92,246,1)",
  },
  {
    name: "Government Bonds EUR",
    apy: "3.5",
    currency: "EUR",
    term: "Stable",
    bankRate: "0.3%",
    sparkline: SPARKLINES[2],
    color: "rgba(160,200,160,1)",
  },
];

function VaultCard({
  vault,
  delay,
}: {
  vault: (typeof VAULTS)[number];
  delay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, active: false });

  const onMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);

  const onLeave = useCallback(() => {
    setMouse((prev) => ({ ...prev, active: false }));
  }, []);

  const rgbaMatch = vault.color.match(/rgba?\(([^)]+)\)/);
  const glowRgb = rgbaMatch ? rgbaMatch[1].replace(/,\s*[\d.]+$/, "") : "255,255,255";

  return (
    <AnimatedSection delay={delay}>
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="h-full p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors relative overflow-hidden"
      >
        {/* Spotlight */}
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            left: mouse.x - 140,
            top: mouse.y - 140,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${glowRgb},0.1) 0%, transparent 70%)`,
            opacity: mouse.active ? 1 : 0,
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs uppercase tracking-wide text-white/30">
              {vault.currency} &middot; {vault.term}
            </span>
            <span className="font-mono text-[10px] text-white/20">
              Bank: {vault.bankRate}
            </span>
          </div>

          <h3 className="font-sans text-base text-white mb-4">
            {vault.name}
          </h3>

          {/* Sparkline */}
          <div className="mb-4">
            <Sparkline data={vault.sparkline} color={vault.color} />
          </div>

          {/* APY */}
          <div className="flex items-baseline gap-1">
            <span className="text-[2.5rem] font-mono font-light text-white leading-none">
              {vault.apy}%
            </span>
            <span className="font-mono text-sm text-white/30">APY</span>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}

export function Vaults() {
  return (
    <section id="vaults" className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Vaults</SectionLabel>
          <SectionTitle>Multiple vaults. One protocol.</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {VAULTS.map((vault, i) => (
            <VaultCard key={vault.name} vault={vault} delay={i * 0.08} />
          ))}
        </div>

        {/* Yield Calculator */}
        <div className="mt-16 max-w-md mx-auto">
          <AnimatedSection delay={0.5}>
            <YieldCalculator />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
