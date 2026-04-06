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
    color: "160,160,200",
  },
];

function PlasmaBeamH({ color }: { color: string }) {
  return (
    <div className="hidden md:flex items-center flex-1 min-w-[16px] relative">
      {/* Wide ambient glow */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[60px]"
        style={{
          background: `rgba(${color},0.07)`,
          filter: "blur(25px)",
          animation: "beamPulse 4s ease-in-out infinite",
        }}
      />
      {/* Medium glow */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[20px]"
        style={{
          background: `rgba(${color},0.2)`,
          filter: "blur(10px)",
          animation: "beamPulse 2.5s ease-in-out infinite 0.5s",
        }}
      />
      {/* Colored core */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[4px] rounded-full"
        style={{
          background: `linear-gradient(90deg, rgba(${color},0.6), rgba(${color},0.9), rgba(${color},0.6))`,
          filter: "blur(1px)",
        }}
      />
      {/* White-hot center */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px]"
        style={{
          background: `linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.7) 50%, transparent 95%)`,
          animation: "beamPulse 2.5s ease-in-out infinite 0.3s",
        }}
      />
      {/* Flowing particles */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[12px]"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${color},0.6) 15%, transparent 30%, transparent 55%, rgba(${color},0.5) 70%, transparent 85%)`,
          backgroundSize: "200% 100%",
          filter: "blur(3px)",
          animation: "beamFlow 2.5s linear infinite",
        }}
      />
    </div>
  );
}

function PlasmaBeamV({ color }: { color: string }) {
  return (
    <div className="md:hidden flex justify-center relative h-12">
      {/* Wide glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] h-full"
        style={{
          background: `rgba(${color},0.08)`,
          filter: "blur(20px)",
          animation: "beamPulse 4s ease-in-out infinite",
        }}
      />
      {/* Medium glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[20px] h-full"
        style={{
          background: `rgba(${color},0.2)`,
          filter: "blur(8px)",
          animation: "beamPulse 2.5s ease-in-out infinite 0.5s",
        }}
      />
      {/* Core */}
      <div
        className="w-[4px] h-full rounded-full relative"
        style={{
          background: `linear-gradient(180deg, rgba(${color},0.6), rgba(${color},0.9), rgba(${color},0.6))`,
          filter: "blur(1px)",
        }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[1.5px] h-full"
          style={{ background: `rgba(255,255,255,0.6)` }}
        />
      </div>
      {/* Particles */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[12px] h-full"
        style={{
          background: `linear-gradient(180deg, transparent, rgba(${color},0.6) 20%, transparent 40%, rgba(${color},0.5) 70%, transparent)`,
          backgroundSize: "100% 200%",
          filter: "blur(3px)",
          animation: "beamFlowV 2.5s linear infinite",
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

      {/* Desktop */}
      <div className="mt-16 hidden md:flex items-stretch">
        <PlasmaBeamH color={AUDIENCES[0].color} />
        {AUDIENCES.map((a, i) => (
          <div key={a.title} className="contents">
            <AnimatedSection delay={i * 0.1}>
              <div className="w-[320px] lg:w-[360px] flex-shrink-0 p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors flex flex-col relative z-10">
                <h3 className={`font-mono text-xs uppercase tracking-wide ${a.accent}`}>{a.title}</h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50 flex-1">{a.description}</p>
              </div>
            </AnimatedSection>
            <PlasmaBeamH color={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].color} />
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="mt-16 md:hidden px-6">
        <PlasmaBeamV color={AUDIENCES[0].color} />
        {AUDIENCES.map((a, i) => (
          <div key={a.title}>
            <AnimatedSection delay={i * 0.1}>
              <div className="p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors relative z-10">
                <h3 className={`font-mono text-xs uppercase tracking-wide ${a.accent}`}>{a.title}</h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50">{a.description}</p>
              </div>
            </AnimatedSection>
            <PlasmaBeamV color={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].color} />
          </div>
        ))}
      </div>
    </section>
  );
}
