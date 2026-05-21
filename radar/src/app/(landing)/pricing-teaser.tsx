"use client";

import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/button";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

const POINTS: readonly { label: string; value: string }[] = [
  { label: "Per minute", value: "60 req" },
  { label: "Per month", value: "10,000 req" },
  { label: "Endpoints", value: "All v1" },
  { label: "Card required", value: "No" },
];

export function PricingTeaser() {
  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-[1200px]">
        <AnimatedSection>
          <SectionLabel>Access</SectionLabel>
          <div className="mt-4">
            <SectionTitle>
              Free during preview.
              <br />
              <span className="text-white/50">Mint a key and start querying.</span>
            </SectionTitle>
          </div>
          <p className="mt-6 max-w-xl font-mono text-base leading-relaxed text-white/55 [&>strong]:font-normal [&>strong]:text-white">
            We're keeping Radar free while we add more chains and per-protocol
            fetchers. <strong>No paid tiers yet, no card, no off-ramp.</strong>
          </p>
        </AnimatedSection>

        <AnimatedSection delay={0.15}>
          <div className="mt-12 rounded-[5px] border border-white/10 bg-surface-1 p-8">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {POINTS.map((p) => (
                <div key={p.label}>
                  <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                    {p.label}
                  </div>
                  <div className="mt-1 font-mono text-lg text-white">{p.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
              <Button variant="filled" href="/dashboard">
                Get a key
              </Button>
              <Button variant="ghost" href="/pricing">
                See pricing →
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
