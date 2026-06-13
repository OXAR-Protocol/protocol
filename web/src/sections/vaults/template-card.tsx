"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/button";
import { scrollToWaitlist } from "@/lib/scroll-to-waitlist";
import { generateGrowthCurve } from "@/lib/growth";

import { ComparisonChart } from "./comparison-chart";

export interface RiskTemplate {
  id: string;
  label: string;
  description: string;
  apyLow: number;
  apyHigh: number;
  sources: string[];
  colorRgb: string;
  accent?: boolean;
}

interface TemplateCardProps {
  template: RiskTemplate;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}

const BANK_APY = 0.4;

export function TemplateCard({
  template,
  isOpen,
  onToggle,
  delay,
}: TemplateCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, active: false });
  const [amount, setAmount] = useState(10000);

  const midApy = (template.apyLow + template.apyHigh) / 2;
  const color = `rgb(${template.colorRgb})`;
  const oxarData = generateGrowthCurve(1000, midApy);
  const bankData = generateGrowthCurve(1000, BANK_APY);
  const yearlyYield = Math.round(amount * (midApy / 100));
  const bankMultiplier = Math.round(midApy / BANK_APY);

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
          isOpen || template.accent
            ? "border-white/20 shadow-[0_0_30px_rgba(139,92,246,0.06)]"
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
            background: `radial-gradient(circle, rgba(${template.colorRgb},0.1) 0%, transparent 70%)`,
            opacity: mouse.active ? 1 : 0,
          }}
        />

        <div className="relative">
          <div className="mb-1">
            <span className="font-mono text-xs uppercase tracking-wide text-white/30">
              {template.description}
            </span>
          </div>

          <h3 className="font-sans text-base text-white mb-4">
            {template.label}
          </h3>

          <div className="mb-4">
            <ComparisonChart
              oxarData={oxarData}
              bankData={bankData}
              color={color}
            />
            <div className="flex justify-between mt-1">
              <span className="font-mono text-[10px] text-white/20">
                $1,000 invested
              </span>
              <div className="flex gap-3">
                <span className="font-mono text-[10px]" style={{ color }}>
                  ● OXAR
                </span>
                <span className="font-mono text-[10px] text-white/20">
                  - - Bank
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-[2.5rem] font-mono font-light text-white leading-none">
              {template.apyLow}-{template.apyHigh}%
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
                  <div className="mb-4">
                    <p className="font-mono text-xs text-white/30 mb-2">
                      Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {template.sources.map((src) => (
                        <span
                          key={src}
                          className="font-mono text-xs px-2 py-1 rounded border border-white/10 text-white/70"
                        >
                          {src}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-sm text-white/50">
                        I want to deposit
                      </span>
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
                      <span className="font-mono text-[10px] text-white/20">
                        $100
                      </span>
                      <span className="font-mono text-[10px] text-white/20">
                        $100,000
                      </span>
                    </div>
                  </div>

                  <div className="text-center py-3 mb-4 rounded-[5px] bg-white/[0.03]">
                    <p className="font-mono text-xs text-white/30 mb-1">
                      Yearly yield
                    </p>
                    <p
                      className="text-[1.8rem] font-mono font-light leading-none"
                      style={{ color }}
                    >
                      +${yearlyYield.toLocaleString()}
                    </p>
                    {bankMultiplier > 1 && (
                      <p className="mt-1.5 font-mono text-xs text-white/40">
                        {bankMultiplier}× more than a bank
                      </p>
                    )}
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <Button variant="filled" onClick={scrollToWaitlist}>
                      Get early access
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
