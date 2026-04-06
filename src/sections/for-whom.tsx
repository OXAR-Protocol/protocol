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
    <div className="hidden md:flex items-center flex-1 min-w-[16px] relative h-[140px]">
      {/* Hourglass shape — wide at edges (cards), narrow center */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`bg-${color.replace(/,/g, "")}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={`rgba(${color},0.25)`} />
            <stop offset="50%" stopColor={`rgba(${color},0.06)`} />
            <stop offset="100%" stopColor={`rgba(${color},0.25)`} />
          </linearGradient>
          <filter id={`blur-${color.replace(/,/g, "")}`}>
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        {/* Main plasma shape */}
        <path
          d="M0,10 C25,10 35,40 50,42 C65,40 75,10 100,10 L100,90 C75,90 65,60 50,58 C35,60 25,90 0,90 Z"
          fill={`url(#bg-${color.replace(/,/g, "")})`}
          filter={`url(#blur-${color.replace(/,/g, "")})`}
          style={{ animation: "beamPulse 3s ease-in-out infinite" }}
        />
        {/* Brighter inner shape */}
        <path
          d="M0,25 C25,25 38,44 50,45 C62,44 75,25 100,25 L100,75 C75,75 62,56 50,55 C38,56 25,75 0,75 Z"
          fill={`rgba(${color},0.15)`}
          filter={`url(#blur-${color.replace(/,/g, "")})`}
          style={{ animation: "beamPulse 2.5s ease-in-out infinite 0.5s" }}
        />
      </svg>

      {/* Core line — also curves slightly with gradient thickness */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full"
        style={{
          background: `linear-gradient(90deg, rgba(${color},0.8), rgba(${color},0.4) 50%, rgba(${color},0.8))`,
          filter: "blur(1px)",
        }}
      />
      {/* White center */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px]"
        style={{
          background: `linear-gradient(90deg, rgba(255,255,255,0.5), rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.5))`,
          animation: "beamPulse 2.5s ease-in-out infinite 0.3s",
        }}
      />

      {/* Flowing particles */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[16px]"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${color},0.5) 15%, transparent 30%, transparent 55%, rgba(${color},0.4) 70%, transparent 85%)`,
          backgroundSize: "200% 100%",
          filter: "blur(4px)",
          animation: "beamFlow 2.5s linear infinite",
        }}
      />
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[10px]"
        style={{
          background: `linear-gradient(90deg, transparent 10%, rgba(255,255,255,0.15) 25%, transparent 40%, rgba(255,255,255,0.1) 60%, transparent 75%)`,
          backgroundSize: "300% 100%",
          filter: "blur(3px)",
          animation: "beamFlow 4s linear infinite 1s",
        }}
      />
    </div>
  );
}

function PlasmaBeamV({ color }: { color: string }) {
  return (
    <div className="md:hidden relative h-14 flex justify-center">
      {/* Hourglass vertical */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
        <defs>
          <linearGradient id={`vbg-${color.replace(/,/g, "")}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={`rgba(${color},0.25)`} />
            <stop offset="50%" stopColor={`rgba(${color},0.06)`} />
            <stop offset="100%" stopColor={`rgba(${color},0.25)`} />
          </linearGradient>
          <filter id={`vblur-${color.replace(/,/g, "")}`}>
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>
        <path
          d="M10,0 C10,25 40,35 42,50 C40,65 10,75 10,100 L90,100 C90,75 60,65 58,50 C60,35 90,25 90,0 Z"
          fill={`url(#vbg-${color.replace(/,/g, "")})`}
          filter={`url(#vblur-${color.replace(/,/g, "")})`}
          style={{ animation: "beamPulse 3s ease-in-out infinite" }}
        />
      </svg>
      {/* Core */}
      <div
        className="w-[3px] h-full rounded-full relative z-[1]"
        style={{
          background: `linear-gradient(180deg, rgba(${color},0.8), rgba(${color},0.4) 50%, rgba(${color},0.8))`,
          filter: "blur(1px)",
        }}
      >
        <div
          className="absolute left-1/2 -translate-x-1/2 w-[1px] h-full"
          style={{ background: `rgba(255,255,255,0.4)` }}
        />
      </div>
      {/* Particles */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[14px] h-full z-[1]"
        style={{
          background: `linear-gradient(180deg, transparent, rgba(${color},0.5) 20%, transparent 40%, rgba(${color},0.4) 70%, transparent)`,
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
              <div className="w-[320px] lg:w-[360px] flex-shrink-0 p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors flex flex-col relative z-10 min-h-[140px]">
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
