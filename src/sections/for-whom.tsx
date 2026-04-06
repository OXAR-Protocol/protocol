"use client";

import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";

const AUDIENCES = [
  {
    title: "DeFi Users",
    description:
      "Higher yield than US Treasuries without leaving crypto. Up to 18% APY on government bonds.",
    accent: "text-accent-blue",
    borderAccent: "hover:border-accent-blue/30",
  },
  {
    title: "Yield Seekers",
    description:
      "Emerging market rates with sovereign backing. Real yield, not inflationary rewards.",
    accent: "text-accent-purple",
    borderAccent: "hover:border-accent-purple/30",
  },
  {
    title: "Institutions",
    description:
      "On-chain emerging market bond exposure. API access coming soon.",
    accent: "text-white/60",
    borderAccent: "hover:border-white/30",
  },
];

export function ForWhom() {
  return (
    <section id="for-whom" className="py-32 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>For Whom</SectionLabel>
          <SectionTitle>One product. Three motivations.</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {AUDIENCES.map((audience, i) => (
            <AnimatedSection key={audience.title} delay={i * 0.1}>
              <div
                className={`h-full p-6 rounded-[5px] border border-white/10 bg-surface-0 transition-colors ${audience.borderAccent}`}
              >
                <h3
                  className={`font-mono text-xs uppercase tracking-wide ${audience.accent}`}
                >
                  {audience.title}
                </h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50">
                  {audience.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
