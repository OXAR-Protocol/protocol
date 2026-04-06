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
    color: "114,162,240",
  },
  {
    title: "Yield Seekers",
    description:
      "Emerging market rates with sovereign backing. Real yield, not inflationary rewards.",
    accent: "text-accent-purple",
    color: "139,92,246",
  },
  {
    title: "Institutions",
    description:
      "On-chain emerging market bond exposure. API access coming soon.",
    accent: "text-white/60",
    color: "180,180,220",
  },
];

function EnergyBeamH({ color, flip }: { color: string; flip?: boolean }) {
  return (
    <div className="hidden md:flex items-center flex-1 min-w-[16px] relative overflow-hidden">
      {/* Core beam */}
      <div className="w-full h-[2px] relative" style={{ background: `rgba(${color},0.4)` }}>
        {/* Animated flow particles */}
        <div
          className="absolute inset-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(${color},0.9) 40%, transparent 60%, rgba(${color},0.9) 80%, transparent 100%)`,
            backgroundSize: "200% 100%",
            animation: flip ? "beamFlowReverse 3s linear infinite" : "beamFlow 3s linear infinite",
          }}
        />
      </div>
      {/* Wide glow */}
      <div
        className="absolute inset-0 -top-6 -bottom-6"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${color},0.12), transparent)`,
          filter: "blur(12px)",
        }}
      />
      {/* Flare near card — right side (entering card) */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[60px] h-[50px]"
        style={{
          background: `radial-gradient(ellipse at ${flip ? "left" : "right"} center, rgba(${color},0.3), transparent 70%)`,
          filter: "blur(8px)",
          ...(flip ? { left: 0, right: "auto" } : {}),
        }}
      />
    </div>
  );
}

function EnergyBeamV({ color }: { color: string }) {
  return (
    <div className="md:hidden flex justify-center relative h-12 overflow-hidden">
      {/* Core */}
      <div className="w-[2px] h-full relative" style={{ background: `rgba(${color},0.4)` }}>
        <div
          className="absolute inset-0 w-[2px]"
          style={{
            background: `linear-gradient(180deg, transparent 0%, rgba(${color},0.9) 40%, transparent 60%, rgba(${color},0.9) 80%, transparent 100%)`,
            backgroundSize: "100% 200%",
            animation: "beamFlowV 3s linear infinite",
          }}
        />
      </div>
      {/* Wide glow */}
      <div
        className="absolute inset-0 -left-6 -right-6"
        style={{
          background: `linear-gradient(180deg, transparent, rgba(${color},0.12), transparent)`,
          filter: "blur(12px)",
        }}
      />
      {/* Flare at top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[50px] h-[30px]"
        style={{
          background: `radial-gradient(ellipse at center top, rgba(${color},0.3), transparent 70%)`,
          filter: "blur(8px)",
        }}
      />
      {/* Flare at bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50px] h-[30px]"
        style={{
          background: `radial-gradient(ellipse at center bottom, rgba(${color},0.3), transparent 70%)`,
          filter: "blur(8px)",
        }}
      />
    </div>
  );
}

export function ForWhom() {
  return (
    <section id="for-whom" className="py-20 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6">
        <AnimatedSection>
          <SectionLabel>For Whom</SectionLabel>
          <SectionTitle>One product. Three motivations.</SectionTitle>
        </AnimatedSection>
      </div>

      {/* Desktop: horizontal */}
      <div className="mt-16 hidden md:flex items-stretch">
        <EnergyBeamH color={AUDIENCES[0].color} />

        {AUDIENCES.map((audience, i) => (
          <div key={audience.title} className="contents">
            <AnimatedSection delay={i * 0.1}>
              <div className="w-[320px] lg:w-[360px] flex-shrink-0 p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors flex flex-col">
                <h3 className={`font-mono text-xs uppercase tracking-wide ${audience.accent}`}>
                  {audience.title}
                </h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50 flex-1">
                  {audience.description}
                </p>
              </div>
            </AnimatedSection>

            <EnergyBeamH
              color={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].color}
              flip={i === AUDIENCES.length - 1}
            />
          </div>
        ))}
      </div>

      {/* Mobile: vertical */}
      <div className="mt-16 md:hidden px-6">
        <EnergyBeamV color={AUDIENCES[0].color} />

        {AUDIENCES.map((audience, i) => (
          <div key={audience.title}>
            <AnimatedSection delay={i * 0.1}>
              <div className="p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors">
                <h3 className={`font-mono text-xs uppercase tracking-wide ${audience.accent}`}>
                  {audience.title}
                </h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50">
                  {audience.description}
                </p>
              </div>
            </AnimatedSection>

            <EnergyBeamV color={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].color} />
          </div>
        ))}
      </div>
    </section>
  );
}
