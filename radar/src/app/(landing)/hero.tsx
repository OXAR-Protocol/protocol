"use client";

import { motion } from "framer-motion";

import { Button } from "@/components/button";
import { FadeIn } from "@/components/fade-in";
import { SectionLabel } from "@/components/section-label";

import { RadarSweep } from "./radar-sweep";

const TICKER_ITEMS: readonly string[] = [
  "BUIDL · $2.1B",
  "ONDO·USDY · $720M",
  "ONDO·OUSG · $251M",
  "BACKED · $245K",
  "MAPLE · $10.6M",
  "CENTRIFUGE · indexing",
  "OXAR · DEVNET",
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle purple glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] animate-breathing"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.18), rgba(139,92,246,0.05), transparent)",
        }}
      />

      <div className="bg-grid absolute inset-0 -z-10" />

      <div className="relative mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 pt-32 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-40 lg:pb-28">
        <div className="relative flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <SectionLabel>RWA Intelligence · Live</SectionLabel>
          </motion.div>

          <motion.h1
            className="mt-6 text-[clamp(2.5rem,6vw,3.75rem)] font-sans font-normal leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            See every RWA.
            <br />
            <span className="text-white/50">Across every chain.</span>
            <br />
            Before everyone else.
          </motion.h1>

          <FadeIn delay={0.4}>
            <p className="mt-7 max-w-xl font-mono text-base leading-relaxed text-white/50 [&>strong]:font-normal [&>strong]:text-white">
              Wallet analysis, protocol data, and AI insights across the entire Real
              World Assets market. <strong>Refreshed every 5 minutes. Queryable in JSON.</strong>
            </p>
          </FadeIn>

          <FadeIn delay={0.6}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button variant="filled" href="/analyze">
                Try the analyzer
              </Button>
              <Button variant="ghost" href="/docs">
                Get API access
              </Button>
            </div>
          </FadeIn>

          <FadeIn delay={0.8}>
            <div className="mt-14 grid max-w-md grid-cols-3 gap-6 border-t border-white/10 pt-6">
              <Stat value="$3.1B" label="AUM tracked" />
              <Stat value="6" label="Protocols" />
              <Stat value="2" label="Chains" />
            </div>
          </FadeIn>
        </div>

        <div className="relative flex items-center justify-center">
          <FadeIn direction="none" delay={0.3}>
            <RadarSweep />
          </FadeIn>
        </div>
      </div>

      {/* Live ticker tape */}
      <div className="relative overflow-hidden border-y border-white/10 bg-surface-1 py-2.5">
        <div
          className="flex w-max gap-12 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.15em] text-white/50"
          style={{ animation: "ticker-scroll 40s linear infinite" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className="text-accent">●</span>
              {item}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl tabular-nums text-white">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        {label}
      </div>
    </div>
  );
}
