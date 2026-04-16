"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/button";
import { useWarp } from "@/components/warp-transition";
import { generateGrowthCurve } from "@/lib/growth";
import { BANK_RATES, CURRENCY_COLORS } from "@/lib/bond-constants";

import { ComparisonChart } from "./comparison-chart";

export interface VaultSummary {
  name: string;
  apy: number;
  currency: string;
  term: string;
}

interface VaultCardProps {
  vault: VaultSummary;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}

export function VaultCard({ vault, isOpen, onToggle, delay }: VaultCardProps) {
  const { startWarp } = useWarp();
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, active: false });
  const [amount, setAmount] = useState(10000);

  const bankApy = BANK_RATES[vault.currency] ?? 1;
  const { color, rgb: glowRgb } = CURRENCY_COLORS[vault.currency] ?? CURRENCY_COLORS.UAH;
  const oxarData = generateGrowthCurve(1000, vault.apy);
  const bankData = generateGrowthCurve(1000, bankApy);
  const yearlyYield = Math.round(amount * (vault.apy / 100));
  const bankMultiplier = Math.round(vault.apy / bankApy);

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
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-xs uppercase tracking-wide text-white/30">
              {vault.currency} &middot; {vault.term}
            </span>
          </div>

          <h3 className="font-sans text-base text-white mb-4">{vault.name}</h3>

          <div className="mb-4">
            <ComparisonChart oxarData={oxarData} bankData={bankData} color={color} />
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-white/20">$1,000 invested</span>
              <div className="flex gap-3">
                <span className="font-mono text-[10px]" style={{ color }}>
                  ● OXAR
                </span>
                <span className="font-mono text-[10px] text-white/20">- - Bank</span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-[2.5rem] font-mono font-light text-white leading-none">
              {vault.apy}%
            </span>
            <span className="font-mono text-sm text-white/30">APY</span>
          </div>

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
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-white/50">I want to invest</span>
                      <span className="font-mono text-sm text-white">${amount.toLocaleString()}</span>
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

                  <div className="text-center py-3 mb-4 rounded-[5px] bg-white/[0.03]">
                    <p className="font-mono text-xs text-white/30 mb-1">Your yearly yield</p>
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
