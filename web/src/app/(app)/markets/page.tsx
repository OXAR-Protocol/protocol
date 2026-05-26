"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { YIELD_SOURCES, type YieldSourceConfig } from "@oxar/sdk";

const CHAIN_LABEL: Record<string, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
  base: "Base",
  arbitrum: "Arbitrum",
};

const RISK_LABEL: Record<string, { label: string; tone: string }> = {
  low: { label: "Low risk", tone: "text-emerald-300/80" },
  medium: { label: "Medium risk", tone: "text-amber-300/80" },
  high: { label: "High risk", tone: "text-rose-300/80" },
};

export default function MarketsPage() {
  const native = YIELD_SOURCES.filter((s) => !s.viaDelora);
  const crossChain = YIELD_SOURCES.filter((s) => s.viaDelora);

  return (
    <div className="max-w-[900px] mx-auto pt-8 pb-32 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>Markets</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl md:text-4xl text-white leading-tight">
          Where your money can sleep
        </h1>
        <p className="mt-3 font-mono text-sm text-white/40 max-w-lg">
          Yield sources we route to. Pick by hand inside a vault, or let a
          risk template do the split.
        </p>
      </motion.div>

      {/* Native */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
          On Solana
        </p>
        <div className="space-y-2">
          {native.map((src) => (
            <MarketRow key={src.id} source={src} />
          ))}
        </div>
      </motion.section>

      {/* Cross-chain via Delora */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-12"
      >
        <div className="flex items-baseline justify-between mb-3">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">
            Cross-chain
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">
            via Delora
          </p>
        </div>
        <div className="space-y-2">
          {crossChain.map((src) => (
            <MarketRow key={src.id} source={src} />
          ))}
        </div>
      </motion.section>

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 p-5 rounded-[8px] border border-white/10"
      >
        <div className="flex items-start gap-3">
          <Sparkles size={16} strokeWidth={1.5} className="text-accent mt-0.5" />
          <div>
            <p className="font-sans text-sm text-white">
              Not financial advice
            </p>
            <p className="mt-1 font-mono text-xs text-white/40 leading-relaxed">
              APYs are current targets, not guarantees. Risk levels are
              indicative. You always sign every move — your money never
              leaves your wallet without your tap.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MarketRow({ source }: { source: YieldSourceConfig }) {
  const risk = RISK_LABEL[source.riskLevel] ?? RISK_LABEL.medium;
  const chain = CHAIN_LABEL[source.chain] ?? source.chain;

  return (
    <Link
      href={source.available ? "/yield" : "#"}
      aria-disabled={!source.available}
      className={`group block p-5 rounded-[8px] border transition ${
        source.available
          ? "border-white/10 hover:border-white/30"
          : "border-white/5 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="font-sans text-base text-white truncate">
              {source.name}
            </p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
              {chain}
            </span>
            {!source.available && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
                · soon
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-xs text-white/40 truncate">
            {source.description}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="font-sans text-xl text-white tabular-nums">
            {source.baseApy.toFixed(1)}%
          </p>
          <p className={`font-mono text-[10px] uppercase tracking-wide ${risk.tone}`}>
            {risk.label}
          </p>
        </div>

        {source.available && (
          <ArrowUpRight
            size={16}
            strokeWidth={1.5}
            className="text-white/30 group-hover:text-white transition shrink-0"
          />
        )}
      </div>
    </Link>
  );
}
