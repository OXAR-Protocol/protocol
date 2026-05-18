"use client";

import { AnimatedSection } from "@/components/animated-section";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";

interface AudienceCard {
  number: string;
  title: string;
  problem: string;
  solution: string;
  accent?: boolean;
}

const CARDS: readonly AudienceCard[] = [
  {
    number: "01",
    title: "RWA Protocols",
    problem: "You read about competitor NAV moves on Twitter, hours late.",
    solution: "Monitor every issuer in real time. Set webhooks. Stop guessing.",
  },
  {
    number: "02",
    title: "DAO Treasuries",
    problem: "Your stablecoin yield is split across six multisigs and zero dashboards.",
    solution: "Track every RWA position across signers in one place.",
    accent: true,
  },
  {
    number: "03",
    title: "Crypto Funds",
    problem: "You don't have historical NAV data to backtest yield strategies.",
    solution: "Five-minute snapshots since day one. Query as a time series.",
  },
];

export function Audience() {
  return (
    <section className="relative py-20 px-6">
      <div className="mx-auto max-w-[1200px]">
        <AnimatedSection>
          <SectionLabel>Who Uses Radar</SectionLabel>
          <div className="mt-4">
            <SectionTitle>
              Built for the people who actually
              <br />
              <span className="text-white/50">move RWA capital.</span>
            </SectionTitle>
          </div>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CARDS.map((card, i) => (
            <AnimatedSection key={card.number} delay={i * 0.1}>
              <div
                className={`group relative flex h-full flex-col gap-6 overflow-hidden rounded-[5px] border bg-surface-0 p-6 transition-colors hover:border-white/20 ${
                  card.accent
                    ? "border-accent/30 shadow-[0_0_40px_rgba(139,92,246,0.06)]"
                    : "border-white/10"
                }`}
              >
                {card.accent && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
                )}
                <div className="relative flex items-center justify-between">
                  <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-white/30">
                    {card.number} /
                  </span>
                  <span
                    className={`h-1.5 w-1.5 rounded-full transition-transform group-hover:scale-150 ${
                      card.accent ? "bg-accent" : "bg-white/40"
                    }`}
                  />
                </div>

                <h3 className="relative text-xl font-normal text-white">{card.title}</h3>

                <div className="relative space-y-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                      Pain
                    </div>
                    <p className="mt-1 font-mono text-sm leading-relaxed text-white/50">
                      {card.problem}
                    </p>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                      Fix
                    </div>
                    <p className="mt-1 font-mono text-sm leading-relaxed text-white">
                      {card.solution}
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
