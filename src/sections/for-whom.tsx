"use client";

import { useRef, useState, useCallback } from "react";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";

const AUDIENCES = [
  {
    title: "DeFi Users",
    stat: "18%",
    statLabel: "APY",
    description:
      "Higher yield than US Treasuries without leaving crypto.",
    accent: "text-accent-blue",
    glowColor: "114,162,240",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="16" cy="16" r="12" opacity="0.4" />
        <path d="M12 16l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Yield Seekers",
    stat: "Govt",
    statLabel: "Backed",
    description:
      "Emerging market rates with sovereign backing. Real yield.",
    accent: "text-accent-purple",
    glowColor: "139,92,246",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M16 4l10 6v12l-10 6L6 22V10l10-6z" opacity="0.4" />
        <path d="M16 10v12M10 16h12" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Institutions",
    stat: "API",
    statLabel: "Ready",
    description:
      "On-chain emerging market bond exposure. Programmatic access.",
    accent: "text-white/60",
    glowColor: "160,160,200",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="6" y="8" width="20" height="16" rx="3" opacity="0.4" />
        <path d="M12 15h8M12 19h5" strokeLinecap="round" />
      </svg>
    ),
  },
];

function SpotlightCard({
  audience,
  delay,
}: {
  audience: (typeof AUDIENCES)[number];
  delay: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0, active: false });

  const onMove = useCallback((e: React.MouseEvent) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, active: true });
  }, []);

  const onLeave = useCallback(() => {
    setMouse((prev) => ({ ...prev, active: false }));
  }, []);

  return (
    <AnimatedSection delay={delay}>
      <div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="h-full p-6 rounded-[5px] border border-white/10 bg-surface-0 hover:border-white/20 transition-colors relative overflow-hidden"
      >
        {/* Spotlight glow from cursor */}
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            left: mouse.x - 120,
            top: mouse.y - 120,
            width: 240,
            height: 240,
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${audience.glowColor},0.12) 0%, transparent 70%)`,
            opacity: mouse.active ? 1 : 0,
          }}
        />

        {/* Content */}
        <div className="relative">
          {/* Icon + title row */}
          <div className="flex items-center gap-3 mb-4">
            <span className={`${audience.accent} opacity-60`}>
              {audience.icon}
            </span>
            <h3 className={`font-mono text-xs uppercase tracking-wide ${audience.accent}`}>
              {audience.title}
            </h3>
          </div>

          {/* Big stat */}
          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="text-[2.5rem] font-mono font-light text-white leading-none">
              {audience.stat}
            </span>
            <span className="font-mono text-sm text-white/30 uppercase">
              {audience.statLabel}
            </span>
          </div>

          {/* Description */}
          <p className="font-mono text-sm leading-relaxed text-white/50">
            {audience.description}
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}

export function ForWhom() {
  return (
    <section id="for-whom" className="py-20 px-6">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>For Whom</SectionLabel>
          <SectionTitle>One product. Three motivations.</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {AUDIENCES.map((audience, i) => (
            <SpotlightCard key={audience.title} audience={audience} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>
  );
}
