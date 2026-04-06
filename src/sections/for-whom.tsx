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
    glowColor: "rgba(114,162,240,0.6)",
    glowColorSoft: "rgba(114,162,240,0.15)",
  },
  {
    title: "Yield Seekers",
    description:
      "Emerging market rates with sovereign backing. Real yield, not inflationary rewards.",
    accent: "text-accent-purple",
    glowColor: "rgba(139,92,246,0.6)",
    glowColorSoft: "rgba(139,92,246,0.15)",
  },
  {
    title: "Institutions",
    description:
      "On-chain emerging market bond exposure. API access coming soon.",
    accent: "text-white/60",
    glowColor: "rgba(255,255,255,0.4)",
    glowColorSoft: "rgba(255,255,255,0.08)",
  },
];

function BeamH({ color, colorSoft }: { color: string; colorSoft: string }) {
  return (
    <div className="hidden md:flex items-center flex-1 min-w-[20px]">
      <div
        className="w-full h-[2px] relative"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      >
        <div
          className="absolute inset-0 -top-3 -bottom-3"
          style={{
            background: `linear-gradient(90deg, transparent, ${colorSoft}, transparent)`,
            filter: "blur(6px)",
          }}
        />
      </div>
    </div>
  );
}

function BeamV({ color, colorSoft }: { color: string; colorSoft: string }) {
  return (
    <div className="md:hidden flex justify-center">
      <div
        className="w-[2px] h-8 relative"
        style={{
          background: `linear-gradient(180deg, transparent, ${color}, transparent)`,
        }}
      >
        <div
          className="absolute inset-0 -left-3 -right-3"
          style={{
            background: `linear-gradient(180deg, transparent, ${colorSoft}, transparent)`,
            filter: "blur(6px)",
          }}
        />
      </div>
    </div>
  );
}

export function ForWhom() {
  return (
    <section id="for-whom" className="py-20 px-0 md:px-0 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <AnimatedSection>
          <SectionLabel>For Whom</SectionLabel>
          <SectionTitle>One product. Three motivations.</SectionTitle>
        </AnimatedSection>
      </div>

      {/* Desktop: horizontal beam layout (full width) */}
      <div className="mt-16 hidden md:flex items-stretch">
        {/* Beam from left edge to first card */}
        <BeamH color={AUDIENCES[0].glowColor} colorSoft={AUDIENCES[0].glowColorSoft} />

        {AUDIENCES.map((audience, i) => (
          <div key={audience.title} className="contents">
            <AnimatedSection delay={i * 0.1}>
              <div
                className="w-[320px] lg:w-[360px] flex-shrink-0 p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors"
              >
                <h3 className={`font-mono text-xs uppercase tracking-wide ${audience.accent}`}>
                  {audience.title}
                </h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50">
                  {audience.description}
                </p>
              </div>
            </AnimatedSection>

            {/* Beam between cards or to right edge */}
            <BeamH
              color={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].glowColor}
              colorSoft={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].glowColorSoft}
            />
          </div>
        ))}
      </div>

      {/* Mobile: vertical beam layout */}
      <div className="mt-16 md:hidden px-6">
        {/* Beam from top */}
        <BeamV color={AUDIENCES[0].glowColor} colorSoft={AUDIENCES[0].glowColorSoft} />

        {AUDIENCES.map((audience, i) => (
          <div key={audience.title}>
            <AnimatedSection delay={i * 0.1}>
              <div
                className="p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors"
              >
                <h3 className={`font-mono text-xs uppercase tracking-wide ${audience.accent}`}>
                  {audience.title}
                </h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50">
                  {audience.description}
                </p>
              </div>
            </AnimatedSection>

            {/* Beam between cards */}
            <BeamV
              color={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].glowColor}
              colorSoft={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].glowColorSoft}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
