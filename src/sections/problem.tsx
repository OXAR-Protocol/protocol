"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";

const STATS = [
  {
    value: "$230B+",
    label: "stablecoins sitting idle at 0% yield",
  },
  {
    value: "4%",
    label: "best on-chain yield today (US Treasuries)",
  },
  {
    value: "4-18%",
    label: "emerging market bond yields, untapped on-chain",
  },
];

export function Problem() {
  return (
    <section id="problem" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>The Problem</SectionLabel>
          <SectionTitle>$230B+ in stablecoins earning nothing</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((stat, i) => (
            <AnimatedSection key={stat.value} delay={i * 0.1}>
              <div className="h-full p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors text-center">
                <div className="text-[clamp(2rem,4vw,3rem)] font-mono font-normal text-white">
                  {stat.value}
                </div>
                <p className="mt-3 font-mono text-sm leading-relaxed text-white/50">
                  {stat.label}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4}>
          <p className="mt-12 font-mono text-base text-white/50 leading-relaxed max-w-2xl mx-auto text-center [&>strong]:text-white [&>strong]:font-normal">
            On-chain treasuries proved demand at 4% APY. Emerging markets
            offer <strong>up to 4.5x more</strong> — but have zero on-chain
            access. Until now.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
