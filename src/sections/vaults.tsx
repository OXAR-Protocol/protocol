"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/button";
import { useWarp } from "@/components/warp-transition";

// Generate realistic NAV growth based on APY over 12 months
function generateNavGrowth(apy: number, points = 24): number[] {
  const dailyRate = apy / 100 / 365;
  const daysPerPoint = 365 / points;
  const data: number[] = [];
  let nav = 1000;
  for (let i = 0; i <= points; i++) {
    data.push(nav);
    nav *= 1 + dailyRate * daysPerPoint;
  }
  return data;
}

function ComparisonChart({
  oxarData,
  bankData,
  color,
}: {
  oxarData: number[];
  bankData: number[];
  color: string;
}) {
  const allValues = [...oxarData, ...bankData];
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min + 0.01;
  const pad = 14; // top padding for labels
  const h = 80;
  const chartH = h - pad;
  const w = 200;
  const labelW = 55;
  const totalW = w + labelW;

  function yPos(v: number) {
    return pad + chartH - ((v - min) / range) * chartH;
  }

  function toPoints(data: number[]) {
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        return `${x},${yPos(v)}`;
      })
      .join(" ");
  }

  function toArea(data: number[]) {
    return `M0,${h} L${data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        return `${x},${yPos(v)}`;
      })
      .join(" L")} L${w},${h} Z`;
  }

  const oxarEnd = oxarData[oxarData.length - 1];
  const bankEnd = bankData[bankData.length - 1];
  const oxarEndY = yPos(oxarEnd);
  const bankEndY = yPos(bankEnd);

  const gradId = `cgrad-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg viewBox={`0 0 ${totalW} ${h}`} className="w-full h-[80px]">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* OXAR area fill */}
      <path d={toArea(oxarData)} fill={`url(#${gradId})`} />

      {/* Bank line — grey, dashed */}
      <polyline
        className="vault-bank-line"
        points={toPoints(bankData)}
        fill="none"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
      />

      {/* OXAR line — colored */}
      <polyline
        points={toPoints(oxarData)}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End labels */}
      <text
        x={w + 6}
        y={oxarEndY + 4}
        fill={color}
        fontSize="9"
        fontFamily="monospace"
      >
        ${Math.round(oxarEnd).toLocaleString()}
      </text>
      <text
        x={w + 6}
        y={bankEndY + 4}
        className="vault-bank-label"
        fill="rgba(255,255,255,0.25)"
        fontSize="9"
        fontFamily="monospace"
      >
        ${Math.round(bankEnd).toLocaleString()}
      </text>
    </svg>
  );
}

const VAULTS = [
  {
    name: "Government Bonds UAH",
    apy: 18,
    bankApy: 3,
    currency: "UAH",
    term: "3-12 months",
    color: "rgba(114,162,240,1)",
    glowRgb: "114,162,240",
  },
  {
    name: "Government Bonds USD",
    apy: 4,
    bankApy: 0.5,
    currency: "USD",
    term: "Stable",
    color: "rgba(139,92,246,1)",
    glowRgb: "139,92,246",
  },
  {
    name: "Government Bonds EUR",
    apy: 3.5,
    bankApy: 0.3,
    currency: "EUR",
    term: "Stable",
    color: "rgba(160,200,160,1)",
    glowRgb: "160,200,160",
  },
];

function VaultCard({
  vault,
  isOpen,
  onToggle,
  delay,
}: {
  vault: (typeof VAULTS)[number];
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}) {
  const { startWarp } = useWarp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, active: false });
  const [amount, setAmount] = useState(10000);

  const oxarData = generateNavGrowth(vault.apy);
  const bankData = generateNavGrowth(vault.bankApy);
  const yearlyYield = Math.round(amount * (vault.apy / 100));
  const bankMultiplier = Math.round(vault.apy / vault.bankApy);

  const onMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);

  const onLeave = useCallback(() => {
    setMouse((prev) => ({ ...prev, active: false }));
  }, []);

  return (
    <AnimatedSection delay={delay}>
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onClick={onToggle}
        className={`p-6 rounded-[5px] border bg-surface-0 transition-all duration-300 relative overflow-hidden cursor-pointer ${
          isOpen
            ? "border-white/20 shadow-[0_0_30px_rgba(114,162,240,0.06)]"
            : "border-white/10 hover:border-white/20"
        }`}
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
            background: `radial-gradient(circle, rgba(${vault.glowRgb},0.1) 0%, transparent 70%)`,
            opacity: mouse.active ? 1 : 0,
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs uppercase tracking-wide text-white/30">
              {vault.currency} &middot; {vault.term}
            </span>
          </div>

          <h3 className="font-sans text-base text-white mb-4">
            {vault.name}
          </h3>

          {/* Comparison chart — OXAR vs Bank */}
          <div className="mb-4">
            <ComparisonChart oxarData={oxarData} bankData={bankData} color={vault.color} />
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-white/20">$1,000 invested</span>
              <div className="flex gap-3">
                <span className="font-mono text-[10px]" style={{ color: vault.color }}>
                  ● OXAR
                </span>
                <span className="font-mono text-[10px] text-white/20">
                  - - Bank
                </span>
              </div>
            </div>
          </div>

          {/* APY */}
          <div className="flex items-baseline gap-1">
            <span className="text-[2.5rem] font-mono font-light text-white leading-none">
              {vault.apy}%
            </span>
            <span className="font-mono text-sm text-white/30">APY</span>
          </div>

          {/* Expandable calculator */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="pt-6 mt-6 border-t border-white/10">
                  {/* Amount slider */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-white/50">I want to invest</span>
                      <span className="font-mono text-sm text-white">
                        ${amount.toLocaleString()}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={100}
                      max={100000}
                      step={100}
                      value={amount}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
                    />
                    <div className="flex justify-between mt-1">
                      <span className="font-mono text-[10px] text-white/20">$100</span>
                      <span className="font-mono text-[10px] text-white/20">$100,000</span>
                    </div>
                  </div>

                  {/* Result */}
                  <div className="text-center py-3 mb-4 rounded-[5px] bg-white/[0.03]">
                    <p className="font-mono text-xs text-white/30 mb-1">
                      Your yearly yield
                    </p>
                    <p className="text-[1.8rem] font-mono font-light text-accent leading-none">
                      +${yearlyYield.toLocaleString()}
                    </p>
                    {bankMultiplier > 1 && (
                      <p className="mt-1.5 font-mono text-xs text-white/40">
                        {bankMultiplier}x more than a bank deposit
                      </p>
                    )}
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <Button variant="filled" onClick={() => startWarp("/login")}>
                      Start Earning
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedSection>
  );
}

export function Vaults() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="vaults" className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Vaults</SectionLabel>
          <SectionTitle>Multiple vaults. One protocol.</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {VAULTS.map((vault, i) => (
            <VaultCard
              key={vault.name}
              vault={vault}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              delay={i * 0.08}
            />
          ))}
        </div>

        <AnimatedSection delay={0.3}>
          <p className="mt-8 text-center font-mono text-xs text-white/20">
            Click a vault to calculate your yield
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
