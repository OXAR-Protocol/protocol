"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { CHAIN_LABEL } from "@/lib/yield";
import { YIELD_SOURCES, type YieldSourceConfig } from "@oxar/sdk";

const RISK_LABEL: Record<string, { label: string; tone: string }> = {
  low: { label: "Low risk", tone: "text-emerald-600" },
  medium: { label: "Medium risk", tone: "text-amber-600" },
  high: { label: "High risk", tone: "text-red-600" },
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
        <h1 className="mt-4 text-[clamp(26px,4vw,44px)] text-black leading-[1.04] tracking-[-0.04em] lowercase">
          Where your money can sleep
        </h1>
        <p className="mt-3 text-sm text-black/45 max-w-lg">
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
        <p className="text-xs lowercase tracking-[0.2em] text-black/40 mb-3">
          On Solana
        </p>
        <div className="space-y-2">
          {native.map((src) => (
            <MarketRow key={src.id} source={src} />
          ))}
        </div>
      </motion.section>

      {/* Cross-chain via Delora — hidden when there are no cross-chain sources */}
      {crossChain.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-12"
        >
        <div className="flex items-baseline justify-between mb-3">
          <p className="text-xs lowercase tracking-[0.2em] text-black/40">
            Cross-chain
          </p>
          <p className="text-[10px] lowercase tracking-wide text-black/40">
            via Delora
          </p>
        </div>
        <div className="space-y-2">
          {crossChain.map((src) => (
            <MarketRow key={src.id} source={src} />
          ))}
        </div>
        </motion.section>
      )}

      {/* Footer note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12 p-5 rounded-[8px] border border-black/10"
      >
        <div className="flex items-start gap-3">
          <Sparkles size={16} strokeWidth={1.5} className="text-[#3c05c7] mt-0.5" />
          <div>
            <p className="text-sm text-black">
              Not financial advice
            </p>
            <p className="mt-1 text-xs text-black/45 leading-relaxed">
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
      href={source.available ? `/asset/${source.id}` : "#"}
      aria-disabled={!source.available}
      className={`group block p-5 rounded-[8px] border transition ${
        source.available
          ? "border-black/10 hover:border-black/30"
          : "border-black/5 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="text-base text-black truncate">
              {source.name}
            </p>
            <span className="text-[10px] lowercase tracking-wide text-black/40">
              {chain}
            </span>
            {!source.available && (
              <span className="text-[10px] lowercase tracking-wide text-black/40">
                · soon
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-black/45 truncate">
            {source.description}
          </p>
        </div>

        <div className="text-right shrink-0">
          <p className="text-xl text-black tabular-nums">
            {source.apyLabel ?? `${source.baseApy.toFixed(1)}%`}
          </p>
          <p className={`text-[10px] lowercase tracking-wide ${risk.tone}`}>
            {risk.label}
          </p>
        </div>

        {source.available && (
          <ArrowUpRight
            size={16}
            strokeWidth={1.5}
            className="text-black/40 group-hover:text-black transition shrink-0"
          />
        )}
      </div>
    </Link>
  );
}
