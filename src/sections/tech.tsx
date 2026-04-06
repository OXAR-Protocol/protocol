"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";

const TECH_ITEMS = [
  "Solana + Anchor smart contracts",
  "Daily NAV accrual on-chain",
  "Email & wallet login via Privy",
  "Built-in P2P marketplace",
  "Deployed on Devnet",
  "Open source on GitHub",
];

export function Tech() {
  return (
    <section id="tech" className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Under the Hood</SectionLabel>
          <SectionTitle>Solana for speed. Privy for access.</SectionTitle>
          <p className="mt-4 font-mono text-sm text-white/30">
            For those who want details. No jargon overload.
          </p>
        </AnimatedSection>

        <div className="mt-12 flex flex-wrap gap-3">
          {TECH_ITEMS.map((item, i) => (
            <AnimatedSection key={item} delay={i * 0.1}>
              <div className="px-5 py-3 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors">
                <span className="font-mono text-sm text-white/50">
                  {item}
                </span>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
