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
    <section className="relative min-h-screen overflow-hidden">
      {/* Radar background — huge, bleeds off the edges */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "min(140vmin, 1500px)",
          height: "min(140vmin, 1500px)",
          maskImage:
            "radial-gradient(circle at center, black 38%, rgba(0,0,0,0.55) 60%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(circle at center, black 38%, rgba(0,0,0,0.55) 60%, transparent 78%)",
        }}
      >
        <RadarSweep bare />
      </div>

      {/* Vignette so the headline reads clean against the radar */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 45%, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 35%, transparent 75%)",
        }}
      />

      {/* Corner HUD labels at viewport edges */}
      <div className="pointer-events-none absolute inset-0 z-20 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
        <span className="absolute left-6 top-24">SCAN · 360°</span>
        <span className="absolute right-6 top-24 text-white">● LIVE</span>
        <span className="absolute bottom-32 left-6">UPDATED 5m</span>
        <span className="absolute bottom-32 right-6">6 NODES TRACKED</span>
      </div>

      {/* Content */}
      <div className="relative z-30 mx-auto flex min-h-screen max-w-[1200px] flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <SectionLabel>RWA Intelligence · Live</SectionLabel>
        </motion.div>

        <motion.h1
          className="mt-8 max-w-4xl text-[clamp(2.5rem,6.5vw,4.5rem)] font-sans font-normal leading-[1.05]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          See every RWA.
          <br />
          <span className="text-white/40">Across every chain.</span>
          <br />
          Before everyone else.
        </motion.h1>

        <FadeIn delay={0.4}>
          <p className="mt-8 max-w-xl font-mono text-base leading-relaxed text-white/55 [&>strong]:font-normal [&>strong]:text-white">
            Wallet analysis, protocol data, and AI insights across the entire Real
            World Assets market.{" "}
            <strong>Refreshed every 5 minutes. Queryable in JSON.</strong>
          </p>
        </FadeIn>

        <FadeIn delay={0.6}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button variant="filled" href="/analyze">
              Try the analyzer
            </Button>
            <Button variant="ghost" href="/docs">
              Get API access
            </Button>
          </div>
        </FadeIn>

        <FadeIn delay={0.8}>
          <div className="mt-16 flex items-center gap-8 font-mono text-xs uppercase tracking-[0.15em] text-white/40">
            <Stat value="$3.1B" label="AUM tracked" />
            <span className="h-6 w-px bg-white/15" />
            <Stat value="6" label="Protocols" />
            <span className="h-6 w-px bg-white/15" />
            <Stat value="2" label="Chains" />
          </div>
        </FadeIn>
      </div>

      {/* Live ticker tape pinned to bottom of viewport */}
      <div className="absolute bottom-0 left-0 right-0 z-30 overflow-hidden border-y border-white/10 bg-surface-0/80 py-2.5 backdrop-blur-sm">
        <div
          className="flex w-max gap-12 whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.15em] text-white/50"
          style={{ animation: "ticker-scroll 40s linear infinite" }}
        >
          {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className="text-white">●</span>
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
    <div className="flex items-baseline gap-2">
      <span className="text-base tabular-nums text-white normal-case tracking-normal">
        {value}
      </span>
      <span className="text-white/40">{label}</span>
    </div>
  );
}
