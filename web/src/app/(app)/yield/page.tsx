"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, List, LayoutGrid } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { CustomSelect } from "@/components/custom-select";
import { YIELD_SOURCES, APY_BUCKETS, type ApyBucket } from "@oxar/sdk";
import { YieldSourceRow } from "@/components/yield-source-row";
import { YieldProviderRow } from "@/components/yield-provider-row";
import { YieldGroupRow } from "@/components/yield-group-row";
import { SourceCard } from "@/components/source-card";
import { YieldSourceSheet } from "@/components/yield-source-sheet";
import { groupProviderViews } from "@/lib/yield";

type Layout = "list" | "grid";
import {
  useYieldPositions,
  type ProviderView,
} from "@/hooks/use-yield-positions";

type ChainFilter = "all" | "solana" | "ethereum";

function matchesApyBucket(bucket: ApyBucket | null, apyPercent: number): boolean {
  if (!bucket) return true;
  const cfg = APY_BUCKETS.find((b) => b.id === bucket);
  return cfg ? cfg.matches(apyPercent) : true;
}

export default function YieldPage() {
  const [apyBucket, setApyBucket] = useState<ApyBucket | null>(null);
  const [chain, setChain] = useState<ChainFilter>("all");
  // The sheet operates on a group (1 provider, or Jupiter's stablecoin set).
  const [active, setActive] = useState<ProviderView[] | null>(null);
  const [layout, setLayout] = useState<Layout>("list");

  useEffect(() => {
    const saved = localStorage.getItem("oxar:yield-layout");
    if (saved === "grid" || saved === "list") setLayout(saved);
  }, []);
  const chooseLayout = (next: Layout) => {
    setLayout(next);
    localStorage.setItem("oxar:yield-layout", next);
  };

  // Live, openable sources backed by real protocol SDKs (v1: Jupiter Lend, Kamino).
  const { views, refresh } = useYieldPositions();

  const liveSources = useMemo(() => {
    return views.filter((v) => {
      if (chain !== "all" && v.chain !== chain) return false;
      return matchesApyBucket(apyBucket, v.apy * 100);
    });
  }, [views, apyBucket, chain]);

  // Collapse same-protocol stablecoins (Jupiter) into one card; others stay standalone.
  const liveGroups = useMemo(() => groupProviderViews(liveSources), [liveSources]);

  // Roadmap catalog — sources not yet integrated as live providers.
  const roadmap = useMemo(() => {
    return YIELD_SOURCES.filter((s) => {
      if (chain !== "all" && s.chain !== chain) return false;
      return matchesApyBucket(apyBucket, s.baseApy);
    });
  }, [apyBucket, chain]);

  const roadmapNative = roadmap.filter((s) => !s.viaDelora);
  const roadmapCrossChain = roadmap.filter((s) => s.viaDelora);
  const nothingMatches =
    liveSources.length === 0 && roadmap.length === 0;

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
          Pick a source. Open it. Deposit. Withdraw anytime. Funds go straight
          into the protocol — you hold your own position.
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

      {/* Live sources */}
      {liveSources.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10"
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-300/50">
              Live now
            </p>
            <div className="flex gap-1">
              {([
                ["list", List],
                ["grid", LayoutGrid],
              ] as const).map(([mode, Icon]) => (
                <button
                  key={mode}
                  onClick={() => chooseLayout(mode)}
                  aria-label={`${mode} view`}
                  className={`p-1.5 rounded-[5px] border transition ${
                    layout === mode
                      ? "border-white/30 text-white"
                      : "border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  <Icon size={14} strokeWidth={1.5} />
                </button>
              ))}
            </div>
          </div>

          {layout === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {liveGroups.map((g) => (
                <SourceCard key={g.key} group={g} onOpen={() => setActive(g.views)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {liveGroups.map((g) =>
                g.views.length > 1 ? (
                  <YieldGroupRow key={g.key} group={g} onOpen={() => setActive(g.views)} />
                ) : (
                  <YieldProviderRow
                    key={g.key}
                    view={g.views[0]}
                    onOpen={() => setActive(g.views)}
                  />
                ),
              )}
            </div>
          )}
        </motion.section>
      )}

      {/* Roadmap — native */}
      {roadmapNative.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
            On Solana · soon
          </p>
          <div className="space-y-2">
            {roadmapNative.map((src) => (
              <YieldSourceRow key={src.id} source={src} />
            ))}
          </div>
        </motion.section>
      )}

      {/* Roadmap — cross-chain */}
      {roadmapCrossChain.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-12"
        >
          <div className="flex items-baseline justify-between mb-3">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">
              Cross-chain · soon
            </p>
            <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">
              via Delora
            </p>
          </div>
          <div className="space-y-2">
            {roadmapCrossChain.map((src) => (
              <YieldSourceRow key={src.id} source={src} />
            ))}
          </div>
        </motion.section>
      )}

      {nothingMatches && (
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
        <YieldSourceSheet
          views={active}
          onClose={() => setActive(null)}
          onDone={refresh}
        />
      )}
    </div>
  );
}
