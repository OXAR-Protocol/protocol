"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SectionLabel } from "@/components/section-label";
import { SectionTitle } from "@/components/section-title";
import { AnimatedSection } from "@/components/animated-section";

function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [value, setValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    if (hasStarted) return;
    setHasStarted(true);
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * end));
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [end, duration, hasStarted]);

  useEffect(() => {
    if (!startOnView || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [start, startOnView]);

  return { value, ref };
}

function StatCard({
  format,
  end,
  endSecondary,
  label,
  delay,
  accent,
}: {
  format: (v: number, v2?: number) => string;
  end: number;
  endSecondary?: number;
  label: string;
  delay: number;
  accent?: boolean;
}) {
  const counter = useCountUp(end, 2000);
  const counter2 = useCountUp(endSecondary ?? 0, 2000);

  return (
    <AnimatedSection delay={delay}>
      <div
        ref={counter.ref}
        className={`relative h-full p-6 rounded-[5px] border bg-surface-0 hover:border-white/20 transition-colors text-center overflow-hidden ${
          accent
            ? "border-accent-blue/30 shadow-[0_0_40px_rgba(114,162,240,0.06)]"
            : "border-white/10"
        }`}
      >
        {accent && (
          <div className="absolute inset-0 bg-gradient-to-b from-accent-blue/5 to-transparent pointer-events-none" />
        )}
        <div
          ref={counter2.ref}
          className="relative text-[clamp(2rem,4vw,3rem)] font-mono font-normal text-white tabular-nums"
        >
          {endSecondary
            ? format(counter.value, counter2.value)
            : format(counter.value)}
        </div>
        <p className="relative mt-3 font-mono text-sm leading-relaxed text-white/50">
          {label}
        </p>
      </div>
    </AnimatedSection>
  );
}

const STATS = [
  {
    format: (v: number) => `$${v}B+`,
    end: 230,
    label: "stablecoins sitting idle at 0% yield",
  },
  {
    format: (v: number) => `${v}%`,
    end: 4,
    label: "best on-chain yield today (US Treasuries)",
  },
  {
    format: (v: number, v2?: number) => `${v}-${v2}%`,
    end: 4,
    endSecondary: 18,
    label: "emerging market bond yields, untapped on-chain",
    accent: true,
  },
];

export function Problem() {
  return (
    <section id="problem" className="relative py-32 px-6 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 50%, black, transparent)",
        }}
      />
      <div className="relative max-w-[1200px] mx-auto">
        <AnimatedSection>
          <SectionLabel>The Problem</SectionLabel>
          <SectionTitle>$230B+ in stablecoins earning nothing</SectionTitle>
        </AnimatedSection>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {STATS.map((stat, i) => (
            <StatCard
              key={i}
              format={stat.format}
              end={stat.end}
              endSecondary={stat.endSecondary}
              label={stat.label}
              delay={i * 0.1}
              accent={stat.accent}
            />
          ))}
        </div>

        <AnimatedSection delay={0.4}>
          <p className="mt-12 font-mono text-base text-white/50 leading-relaxed max-w-2xl mx-auto text-center [&>strong]:text-white [&>strong]:font-normal">
            On-chain treasuries proved demand at 4% APY. Emerging markets
            offer <strong>up to 4.5x more</strong> — but have zero on-chain
            access. Until now.
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
