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
    <div className="hidden md:block flex-1 min-w-[16px] relative h-[160px] self-center">
      {/* Ambient wide glow */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120px]"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, rgba(${color},0.12), transparent)`,
          filter: "blur(30px)",
          animation: "beamPulse 4s ease-in-out infinite",
        }}
      />

      {/* Funnel flare — left (coming from card) */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[60%] h-full"
        style={{
          background: `linear-gradient(90deg, rgba(${color},0.25), transparent)`,
          clipPath: "polygon(0 15%, 100% 42%, 100% 58%, 0 85%)",
          filter: "blur(6px)",
          animation: "beamPulse 3s ease-in-out infinite 0.3s",
        }}
      />

      {/* Funnel flare — right (entering card) */}
      <div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[60%] h-full"
        style={{
          background: `linear-gradient(270deg, rgba(${color},0.25), transparent)`,
          clipPath: "polygon(0 42%, 100% 15%, 100% 85%, 0 58%)",
          filter: "blur(6px)",
          animation: "beamPulse 3s ease-in-out infinite 0.8s",
        }}
      />

      {/* Bright core — wide */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[6px]"
        style={{
          background: `linear-gradient(90deg, rgba(${color},0.3), rgba(${color},0.7), rgba(${color},0.3))`,
          filter: "blur(2px)",
        }}
      />

      {/* Hot white center */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px]"
        style={{
          background: `linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.6) 30%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 70%, transparent 95%)`,
          animation: "beamPulse 2.5s ease-in-out infinite 0.5s",
        }}
      />

      {/* Flowing energy particles */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[20px]"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(${color},0.5) 15%, transparent 30%, transparent 50%, rgba(${color},0.6) 65%, transparent 80%, rgba(${color},0.4) 90%, transparent)`,
          backgroundSize: "200% 100%",
          filter: "blur(4px)",
          animation: "beamFlow 2.5s linear infinite",
        }}
      />
      {/* Second particle layer */}
      <div
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[14px]"
        style={{
          background: `linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.3) 20%, transparent 35%, rgba(255,255,255,0.2) 55%, transparent 70%, rgba(255,255,255,0.35) 85%, transparent 95%)`,
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
    <div className="md:hidden relative h-16 flex justify-center">
      {/* Ambient glow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 w-[120px] h-full"
        style={{
          background: `radial-gradient(ellipse 100% 100% at 50% 50%, rgba(${color},0.15), transparent)`,
          filter: "blur(20px)",
          animation: "beamPulse 4s ease-in-out infinite",
        }}
      />
      {/* Funnel top */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[60%]"
        style={{
          background: `linear-gradient(180deg, rgba(${color},0.3), transparent)`,
          clipPath: "polygon(15% 0, 85% 0, 58% 100%, 42% 100%)",
          filter: "blur(4px)",
        }}
      />
      {/* Funnel bottom */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[100px] h-[60%]"
        style={{
          background: `linear-gradient(0deg, rgba(${color},0.3), transparent)`,
          clipPath: "polygon(42% 0, 58% 0, 85% 100%, 15% 100%)",
          filter: "blur(4px)",
        }}
      />
      {/* Core */}
      <div
        className="w-[6px] h-full relative"
        style={{
          background: `linear-gradient(180deg, rgba(${color},0.3), rgba(${color},0.7), rgba(${color},0.3))`,
          filter: "blur(2px)",
        }}
      >
        <div
          className="absolute inset-0 w-[2px] left-1/2 -translate-x-1/2"
          style={{ background: `rgba(255,255,255,0.7)` }}
        />
      </div>
      {/* Particles */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[20px] h-full"
        style={{
          background: `linear-gradient(180deg, transparent, rgba(${color},0.6) 20%, transparent 40%, rgba(${color},0.5) 60%, transparent 80%)`,
          backgroundSize: "100% 200%",
          filter: "blur(4px)",
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
