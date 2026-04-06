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

function EnergyBeamH({ color }: { color: string }) {
  return (
    <div className="hidden md:flex items-center flex-1 min-w-[16px] relative">
      {/* Outer glow — slow pulse */}
      <div
        className="absolute inset-0 -top-10 -bottom-10"
        style={{
          background: `linear-gradient(90deg, transparent 5%, rgba(${color},0.08) 30%, rgba(${color},0.15) 50%, rgba(${color},0.08) 70%, transparent 95%)`,
          filter: "blur(20px)",
          animation: "beamPulse 4s ease-in-out infinite",
        }}
      />
      {/* Mid glow — medium pulse */}
      <div
        className="absolute inset-0 -top-4 -bottom-4"
        style={{
          background: `linear-gradient(90deg, transparent 10%, rgba(${color},0.2) 40%, rgba(${color},0.35) 50%, rgba(${color},0.2) 60%, transparent 90%)`,
          filter: "blur(8px)",
          animation: "beamPulse 2.5s ease-in-out infinite 0.5s",
        }}
      />
      {/* Core line */}
      <div
        className="w-full h-[2px] relative"
        style={{ background: `rgba(${color},0.5)` }}
      >
        {/* Flowing particles — fast */}
        <div
          className="absolute inset-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${color},1) 20%, transparent 40%, transparent 60%, rgba(${color},1) 80%, transparent)`,
            backgroundSize: "200% 100%",
            animation: "beamFlow 2s linear infinite",
          }}
        />
        {/* Second particle layer — offset timing */}
        <div
          className="absolute inset-0 h-[2px]"
          style={{
            background: `linear-gradient(90deg, transparent 10%, rgba(${color},0.8) 30%, transparent 50%, rgba(${color},0.8) 70%, transparent 90%)`,
            backgroundSize: "300% 100%",
            animation: "beamFlow 3.5s linear infinite 1s",
          }}
        />
      </div>
      {/* Flare near right card */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[80px] h-[80px]"
        style={{
          background: `radial-gradient(ellipse at right center, rgba(${color},0.25), transparent 70%)`,
          filter: "blur(10px)",
          animation: "beamPulse 3s ease-in-out infinite 0.3s",
        }}
      />
      {/* Flare near left card */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[80px] h-[80px]"
        style={{
          background: `radial-gradient(ellipse at left center, rgba(${color},0.25), transparent 70%)`,
          filter: "blur(10px)",
          animation: "beamPulse 3s ease-in-out infinite 0.8s",
        }}
      />
    </div>
  );
}

function EnergyBeamV({ color }: { color: string }) {
  return (
    <div className="md:hidden flex justify-center relative h-14">
      {/* Outer glow */}
      <div
        className="absolute inset-0 -left-10 -right-10"
        style={{
          background: `linear-gradient(180deg, transparent 5%, rgba(${color},0.1) 30%, rgba(${color},0.15) 50%, rgba(${color},0.1) 70%, transparent 95%)`,
          filter: "blur(20px)",
          animation: "beamPulse 4s ease-in-out infinite",
        }}
      />
      {/* Mid glow */}
      <div
        className="absolute inset-0 -left-4 -right-4"
        style={{
          background: `linear-gradient(180deg, transparent 10%, rgba(${color},0.25) 40%, rgba(${color},0.35) 50%, rgba(${color},0.25) 60%, transparent 90%)`,
          filter: "blur(8px)",
          animation: "beamPulse 2.5s ease-in-out infinite 0.5s",
        }}
      />
      {/* Core */}
      <div className="w-[2px] h-full relative" style={{ background: `rgba(${color},0.5)` }}>
        <div
          className="absolute inset-0 w-[2px]"
          style={{
            background: `linear-gradient(180deg, transparent, rgba(${color},1) 20%, transparent 40%, transparent 60%, rgba(${color},1) 80%, transparent)`,
            backgroundSize: "100% 200%",
            animation: "beamFlowV 2s linear infinite",
          }}
        />
      </div>
      {/* Flares */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] h-[40px]"
        style={{
          background: `radial-gradient(ellipse at center top, rgba(${color},0.3), transparent 70%)`,
          filter: "blur(10px)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80px] h-[40px]"
        style={{
          background: `radial-gradient(ellipse at center bottom, rgba(${color},0.3), transparent 70%)`,
          filter: "blur(10px)",
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
        <EnergyBeamH color={AUDIENCES[0].color} />
        {AUDIENCES.map((a, i) => (
          <div key={a.title} className="contents">
            <AnimatedSection delay={i * 0.1}>
              <div className="w-[320px] lg:w-[360px] flex-shrink-0 p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors flex flex-col relative z-10">
                <h3 className={`font-mono text-xs uppercase tracking-wide ${a.accent}`}>{a.title}</h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50 flex-1">{a.description}</p>
              </div>
            </AnimatedSection>
            <EnergyBeamH color={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].color} />
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="mt-16 md:hidden px-6">
        <EnergyBeamV color={AUDIENCES[0].color} />
        {AUDIENCES.map((a, i) => (
          <div key={a.title}>
            <AnimatedSection delay={i * 0.1}>
              <div className="p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors relative z-10">
                <h3 className={`font-mono text-xs uppercase tracking-wide ${a.accent}`}>{a.title}</h3>
                <p className="mt-4 font-mono text-sm leading-relaxed text-white/50">{a.description}</p>
              </div>
            </AnimatedSection>
            <EnergyBeamV color={AUDIENCES[Math.min(i + 1, AUDIENCES.length - 1)].color} />
          </div>
        ))}
      </div>
    </section>
  );
}
