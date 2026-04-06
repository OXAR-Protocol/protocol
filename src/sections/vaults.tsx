"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";
import { YieldCalculator } from "@/components/yield-calculator";

const VAULTS = [
  { name: "Government Bonds UAH", apy: "18%", currency: "UAH", term: "3-12 months" },
  { name: "Government Bonds USD", apy: "4%", currency: "USD", term: "Stable" },
  { name: "Government Bonds EUR", apy: "3.5%", currency: "EUR", term: "Stable" },
];

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
            <AnimatedSection key={vault.name} delay={i * 0.08}>
              <div
                className="h-full p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors"
              >
                <span className="font-mono text-xs uppercase tracking-wide text-white/30">
                  {vault.currency} &middot; {vault.term}
                </span>
                <h3 className="mt-2 font-sans text-lg text-white">
                  {vault.name}
                </h3>
                <div className="mt-3 text-[clamp(1.8rem,3vw,2.5rem)] font-mono font-normal text-white">
                  {vault.apy}
                  <span className="text-sm text-white/30 ml-1">APY</span>
                </div>
              </div>
            </AnimatedSection>
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
