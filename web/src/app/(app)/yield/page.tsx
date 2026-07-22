"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { X, List, LayoutGrid } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { CustomSelect } from "@/components/custom-select";
import { YIELD_SOURCES, APY_BUCKETS, type ApyBucket } from "@oxar/sdk";
import { YieldSourceRow } from "@/components/yield-source-row";
import { YieldProviderRow } from "@/components/yield-provider-row";
import { YieldGroupRow } from "@/components/yield-group-row";
import { SourceCard } from "@/components/source-card";
import { groupProviderViews } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { XSTOCKS } from "@/lib/yield/xstocks";
import { GOLD } from "@/lib/yield/gold";
import { AssetSection } from "@/components/asset-section";
import { PhotoBg } from "@/components/photo-bg";
import { useYieldPositions } from "@/hooks/use-yield-positions";
import { useT } from "@/lib/i18n";

type Layout = "list" | "grid";

type ChainFilter = "all" | "solana" | "ethereum";

function matchesApyBucket(bucket: ApyBucket | null, apyPercent: number): boolean {
  if (!bucket) return true;
  const cfg = APY_BUCKETS.find((b) => b.id === bucket);
  return cfg ? cfg.matches(apyPercent) : true;
}

export default function YieldPage() {
  const router = useRouter();
  const { t } = useT();
  const [apyBucket, setApyBucket] = useState<ApyBucket | null>(null);
  const [chain, setChain] = useState<ChainFilter>("all");
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
  const { views } = useYieldPositions();

  const liveSources = useMemo(() => {
    return views.filter((v) => {
      if (isPriceExposure(v.id)) return false; // stocks & gold show in their own price-framed sections
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
        <h1 className="mt-4 text-[clamp(26px,4vw,44px)] text-black leading-[1.04] tracking-[-0.04em] lowercase">
          {t("yield.title")}
        </h1>
        <p className="mt-3 text-sm text-black/45 max-w-lg">
          {t("yield.subtitle")}
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
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs transition ${
                  isActive
                    ? "border-[#3c05c7]/60 bg-[#3c05c7]/[0.06] text-black"
                    : "border-black/10 hover:border-black/30 text-black/60"
                }`}
              >
                <span>{bucket.emoji}</span>
                <span className="lowercase tracking-wide">{bucket.label}</span>
              </button>
            );
          })}
          {apyBucket && (
            <button
              onClick={() => setApyBucket(null)}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-[10px] lowercase tracking-wide text-black/40 hover:text-black"
              title="Clear filter"
            >
              <X size={11} strokeWidth={1.5} />
              {t("yield.clear")}
            </button>
          )}
        </div>

        <div className="ml-auto">
          <CustomSelect
            value={chain}
            onChange={(v) => setChain(v as ChainFilter)}
            options={[
              { value: "all", label: t("yield.chain.all") },
              { value: "solana", label: t("yield.chain.solana") },
              { value: "ethereum", label: t("yield.chain.cross") },
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
            <p className="text-xs lowercase tracking-[0.2em] text-emerald-600">
              {t("yield.liveNow")}
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
                      ? "border-black/30 text-black"
                      : "border-black/10 text-black/45 hover:text-black/70"
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
                <SourceCard key={g.key} group={g} onOpen={() => router.push(`/asset/${g.views[0].id}`)} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {liveGroups.map((g) =>
                g.views.length > 1 ? (
                  <YieldGroupRow key={g.key} group={g} onOpen={() => router.push(`/asset/${g.views[0].id}`)} />
                ) : (
                  <YieldProviderRow
                    key={g.key}
                    view={g.views[0]}
                    onOpen={() => router.push(`/asset/${g.views[0].id}`)}
                  />
                ),
              )}
            </div>
          )}
        </motion.section>
      )}

      {/* Tokenized stocks — price-framed section (Reg S geoblocked) */}
      <AssetSection
        catalog={XSTOCKS}
        title={t("yield.stocksTitle")}
        badge="non-US"
        kind="Stock"
        note="tokenized · non-US"
        gated
        filterable
        layout={layout}
      />

      {/* Tokenized commodities — physical gold (not a security; no geoblock) */}
      <AssetSection
        catalog={GOLD}
        title={t("yield.goldTitle")}
        badge="physical"
        kind="Commodity"
        note="physical gold · tokenized"
        layout={layout}
      />

      {/* Roadmap — native */}
      {roadmapNative.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10"
        >
          <p className="text-xs lowercase tracking-[0.2em] text-black/40 mb-3">
            {t("yield.soonSolana")}
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
            <p className="text-xs lowercase tracking-[0.2em] text-black/40">
              {t("yield.soonCross")}
            </p>
            <p className="text-[10px] lowercase tracking-wide text-black/40">
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
        <p className="mt-12 text-sm text-black/40 text-center">
          {t("yield.noMatch")}
        </p>
      )}

      <div className="relative mt-12 overflow-hidden p-5 rounded-[8px] border border-black/10">
        <PhotoBg src="/art/coin-collage.webp" scrim="left" position="object-right" />
        <p className="relative text-sm text-black">{t("yield.nfa.title")}</p>
        <p className="relative mt-1 text-xs text-black/45 leading-relaxed">
          {t("yield.nfa.body")}
        </p>
      </div>
    </div>
  );
}
