"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { CustomSelect } from "@/components/custom-select";
import {
  YIELD_SOURCES,
  APY_BUCKETS,
  type YieldSourceConfig,
  type ApyBucket,
} from "@oxar/sdk";
import { YieldSourceRow } from "@/components/yield-source-row";
import { YieldSourceSheet } from "@/components/yield-source-sheet";

type ChainFilter = "all" | "solana" | "ethereum";

export default function YieldPage() {
  const [apyBucket, setApyBucket] = useState<ApyBucket | null>(null);
  const [chain, setChain] = useState<ChainFilter>("all");
  const [active, setActive] = useState<YieldSourceConfig | null>(null);

  const filtered = useMemo(() => {
    return YIELD_SOURCES.filter((s) => {
      if (chain !== "all" && s.chain !== chain) return false;
      if (apyBucket) {
        const bucket = APY_BUCKETS.find((b) => b.id === apyBucket);
        if (bucket && !bucket.matches(s.baseApy)) return false;
      }
      return true;
    });
  }, [apyBucket, chain]);

  const native = filtered.filter((s) => !s.viaDelora);
  const crossChain = filtered.filter((s) => s.viaDelora);

  return (
    <div className="max-w-[900px] mx-auto pt-8 pb-32 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>Yield</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl md:text-4xl text-white leading-tight">
          Where your money can sleep
        </h1>
        <p className="mt-3 font-mono text-sm text-white/40 max-w-lg">
          Pick a source. Open it. Deposit. Withdraw anytime. One vault per
          source — your shares stay separate.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-8 flex flex-wrap items-center gap-3"
      >
        <div className="flex flex-wrap gap-2">
          {APY_BUCKETS.map((bucket) => {
            const isActive = apyBucket === bucket.id;
            return (
              <button
                key={bucket.id}
                onClick={() => setApyBucket(isActive ? null : bucket.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-mono text-xs transition ${
                  isActive
                    ? "border-accent/60 bg-accent/[0.06] text-white"
                    : "border-white/10 hover:border-white/30 text-white/60"
                }`}
              >
                <span>{bucket.emoji}</span>
                <span className="uppercase tracking-wide">{bucket.label}</span>
              </button>
            );
          })}
          {apyBucket && (
            <button
              onClick={() => setApyBucket(null)}
              className="inline-flex items-center gap-1 px-2 py-1.5 font-mono text-[10px] uppercase tracking-wide text-white/30 hover:text-white"
              title="Clear filter"
            >
              <X size={11} strokeWidth={1.5} />
              clear
            </button>
          )}
        </div>

        <div className="ml-auto">
          <CustomSelect
            value={chain}
            onChange={(v) => setChain(v as ChainFilter)}
            options={[
              { value: "all", label: "All chains" },
              { value: "solana", label: "Solana only" },
              { value: "ethereum", label: "Cross-chain only" },
            ]}
          />
        </div>
      </motion.section>

      {/* Native sources */}
      {native.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
            On Solana
          </p>
          <div className="space-y-2">
            {native.map((src) => (
              <YieldSourceRow
                key={src.id}
                source={src}
                onOpen={() => setActive(src)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {/* Cross-chain */}
      {crossChain.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
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
              <YieldSourceRow
                key={src.id}
                source={src}
                onOpen={() => setActive(src)}
              />
            ))}
          </div>
        </motion.section>
      )}

      {filtered.length === 0 && (
        <p className="mt-12 font-mono text-sm text-white/30 text-center">
          No sources match these filters.
        </p>
      )}

      <div className="mt-12 p-5 rounded-[8px] border border-white/10">
        <p className="font-sans text-sm text-white">Not financial advice</p>
        <p className="mt-1 font-mono text-xs text-white/40 leading-relaxed">
          APYs are current targets, not guarantees. You always sign every move.
        </p>
      </div>

      {active && (
        <YieldSourceSheet source={active} onClose={() => setActive(null)} />
      )}
    </div>
  );
}
