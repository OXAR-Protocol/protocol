"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";
import { IsometricBoxes } from "@/components/isometric-boxes";
import { useCountUp } from "@/hooks/use-count-up";

function AnimatedStat() {
  const counter = useCountUp(12, 2000);
  return (
    <div ref={counter.ref} className="text-center">
      <div className="text-[clamp(2.5rem,5vw,4rem)] font-mono font-normal text-white tabular-nums">
        {counter.value}×
      </div>
      <p className="mt-2 font-mono text-sm text-white/50">your bank's rate</p>
    </div>
  );
}

const STATIC_STATS = [
  { value: "Instant", label: "withdraw anytime" },
  { value: "Yours", label: "your keys, your money" },
  { value: "<2min", label: "to start earning" },
];

export function Features() {
  return (
    <section className="relative py-20 px-6 overflow-hidden">
      <IsometricBoxes className="opacity-40 pointer-events-none" />

      <div className="relative max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>Why OXAR</SectionLabel>
          <SectionTitle>Earn like an investor. Access like savings.</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <AnimatedSection delay={0}>
            <AnimatedStat />
          </AnimatedSection>

          {STATIC_STATS.map((stat, i) => (
            <AnimatedSection key={stat.value} delay={(i + 1) * 0.1}>
              <div className="text-center">
                <div className="text-[clamp(2.5rem,5vw,4rem)] font-mono font-normal text-white">
                  {stat.value}
                </div>
                <p className="mt-2 font-mono text-sm text-white/50">{stat.label}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
