"use client";

import { AnimatedSection } from "@/components/animated-section";
import { Button } from "@/components/button";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

interface Tier {
  name: string;
  price: string;
  unit?: string;
  feature: string;
  rpm: string;
  highlight?: boolean;
}

const TIERS: readonly Tier[] = [
  { name: "Free", price: "$0", feature: "Eval + side projects", rpm: "60 / min" },
  { name: "Starter", price: "$99", unit: "USDC / mo", feature: "Solo builders, small dapps", rpm: "600 / min" },
  { name: "Pro", price: "$499", unit: "USDC / mo", feature: "DAO treasuries, small funds", rpm: "6k / min", highlight: true },
  { name: "Enterprise", price: "Custom", feature: "Institutional desks", rpm: "Unlimited" },
];

export function PricingTeaser() {
  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-[1200px]">
        <AnimatedSection>
          <SectionLabel>Pricing</SectionLabel>
          <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <SectionTitle>
              Pay in USDC.
              <br />
              <span className="text-white/50">Settle in seconds.</span>
            </SectionTitle>
            <span className="inline-flex items-center gap-2 self-start rounded border border-accent/30 bg-accent/5 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-accent lg:self-end">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Helio Pay · USDC subscriptions
            </span>
          </div>
        </AnimatedSection>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => (
            <AnimatedSection key={tier.name} delay={i * 0.08}>
              <div
                className={`relative flex h-full flex-col rounded-[5px] border bg-surface-0 p-6 ${
                  tier.highlight
                    ? "border-accent/30 shadow-[0_0_40px_rgba(139,92,246,0.06)]"
                    : "border-white/10"
                }`}
              >
                {tier.highlight && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
                )}
                {tier.highlight && (
                  <span className="absolute -top-2.5 right-4 rounded bg-accent px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.15em] text-white">
                    Recommended
                  </span>
                )}
                <div className="relative font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                  {tier.name}
                </div>
                <div className="relative mt-3 flex items-baseline gap-2">
                  <span className="font-mono text-3xl tabular-nums text-white">{tier.price}</span>
                  {tier.unit && <span className="font-mono text-xs text-white/50">{tier.unit}</span>}
                </div>
                <p className="relative mt-3 font-mono text-sm text-white/50">{tier.feature}</p>
                <div className="relative mt-auto pt-6 font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                  {tier.rpm}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection delay={0.4}>
          <div className="mt-12">
            <Button variant="ghost" href="/pricing">
              See full pricing →
            </Button>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
