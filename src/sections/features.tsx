"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";
import { IsometricBoxes } from "@/components/isometric-boxes";

const ITEMS = [
  "Government Backed",
  "Up to 18% APY",
  "On-Chain Transparent",
  "Trade 24/7",
  "No Lock-ups",
  "Real Yield",
  "Open Source",
  "Solana Speed",
];

export function Features() {
  return (
    <section className="relative py-20 overflow-hidden">
      <IsometricBoxes className="opacity-40 pointer-events-none" />

      <div className="relative max-w-[1200px] mx-auto px-6 mb-12">
        <AnimatedSection>
          <SectionLabel>Why OXAR</SectionLabel>
          <SectionTitle>Real yields, on-chain</SectionTitle>
        </AnimatedSection>
      </div>

      {/* Marquee — two rows, opposite directions */}
      <div className="relative space-y-4">
        {/* Row 1 — left to right */}
        <div className="overflow-hidden">
          <div className="flex gap-4 animate-marquee">
            {[...ITEMS, ...ITEMS].map((item, i) => (
              <span
                key={`r1-${i}`}
                className="flex-shrink-0 px-6 py-3 rounded-[5px] border border-white/10 bg-surface-0 font-mono text-sm text-white/60 whitespace-nowrap hover:border-white/20 hover:text-white transition-colors"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Row 2 — right to left */}
        <div className="overflow-hidden">
          <div className="flex gap-4 animate-marquee-reverse">
            {[...ITEMS.slice(4), ...ITEMS.slice(0, 4), ...ITEMS.slice(4), ...ITEMS.slice(0, 4)].map((item, i) => (
              <span
                key={`r2-${i}`}
                className="flex-shrink-0 px-6 py-3 rounded-[5px] border border-white/10 bg-surface-0 font-mono text-sm text-white/60 whitespace-nowrap hover:border-white/20 hover:text-white transition-colors"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
