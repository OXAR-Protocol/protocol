"use client";

import { useState } from "react";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";

import { TemplateCard, type RiskTemplate } from "./vaults/template-card";

const TEMPLATES: RiskTemplate[] = [
  {
    id: "sleepy",
    label: "Sleepy",
    description: "Slow but steady",
    apyLow: 4,
    apyHigh: 6,
    sources: ["Ondo USDY", "Kamino USDC"],
    colorRgb: "114,162,240",
  },
  {
    id: "walking",
    label: "Walking",
    description: "Balanced pace",
    apyLow: 6,
    apyHigh: 9,
    sources: ["Maple Syrup", "Kamino", "JLP"],
    colorRgb: "139,92,246",
    accent: true,
  },
  {
    id: "running",
    label: "Running",
    description: "Fast and loud",
    apyLow: 9,
    apyHigh: 14,
    sources: ["Ethena sUSDe", "JLP", "Drift"],
    colorRgb: "236,72,153",
  },
];

export function Vaults() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="vaults" className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>How loud do you want your money</SectionLabel>
          <SectionTitle>Three speeds. One pile.</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {TEMPLATES.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              delay={i * 0.08}
            />
          ))}
        </div>

        <AnimatedSection delay={0.3}>
          <p className="mt-8 text-center font-mono text-xs text-white/20">
            Click a speed to see what your money does there
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
