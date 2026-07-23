"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowUpRight, List, LayoutGrid } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { LiveAmount } from "@/components/live-amount";
import { PositionCard } from "@/components/position-card";
import {
  useYieldPositions,
  type ProviderView,
} from "@/hooks/use-yield-positions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { RISK_TONE, fromBaseUnits } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { AssetIcon } from "@/components/asset-icon";
import { PhotoBg } from "@/components/photo-bg";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useT } from "@/lib/i18n";

type Layout = "list" | "grid";

export default function PilePage() {
  const router = useRouter();
  const { t } = useT();
  const { views, totalValue, loading } = useYieldPositions();
  const [layout, setLayout] = useState<Layout>("list");

  // Remember the user's preferred layout across visits.
  useEffect(() => {
    const saved = localStorage.getItem("oxar:pile-layout");
    if (saved === "grid" || saved === "list") setLayout(saved);
  }, []);
  const chooseLayout = (next: Layout) => {
    setLayout(next);
    localStorage.setItem("oxar:pile-layout", next);
  };

  // Pile is the portfolio: only sources where you actually hold a position.
  // (Browse/deposit lives on /yield.)
  const held = views.filter((v) => v.underlyingBalance > BigInt(0));

  // 24h price change for price-exposure positions (stocks/gold) — shown instead
  // of "0.00% APY" on those cards.
  const priceMints = held
    .filter((v) => isPriceExposure(v.id) && v.heldMint)
    .map((v) => v.heldMint as string);
  const { prices } = useStockPrices(priceMints);
  const change24hOf = (v: ProviderView) =>
    isPriceExposure(v.id) && v.heldMint ? prices[v.heldMint]?.change24h : undefined;

  // Value-weighted APY across held positions — drives the live total ticker.
  const blendedApy =
    totalValue > 0
      ? held.reduce(
          (acc, v) => acc + fromBaseUnits(v.underlyingBalance, v.decimals) * v.apy,
          0,
        ) / totalValue
      : 0;

  return (
    <div className="max-w-[900px] mx-auto pt-8 pb-32 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>portfolio</SectionLabel>
        <h1 className="mt-4 text-[clamp(26px,4vw,44px)] text-black leading-[1.04] tracking-[-0.04em] lowercase">
          {t("pile.title")}
        </h1>
        <p className="mt-3 text-sm text-black/45 max-w-lg">
          {t("pile.subtitle")}
        </p>
      </motion.div>

      {/* Total */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative mt-8 overflow-hidden p-6 rounded-[8px] border border-black/10 bg-white"
      >
        <PhotoBg src="/art/coin-stacking.webp" scrim="left" position="object-right" />
        <p className="relative text-xs lowercase tracking-[0.2em] text-black/40">
          {t("pile.total")}
        </p>
        <div className="relative mt-2">
          {loading ? (
            <Loader2 className="animate-spin text-black/40" size={28} />
          ) : (
            <LiveAmount value={totalValue} apy={blendedApy} variant="lg" />
          )}
        </div>
      </motion.section>

      {/* Per-source positions */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs lowercase tracking-[0.2em] text-black/40">
            {t("pile.positions")}
          </p>
          {held.length > 0 && (
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
          )}
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-black/40" size={24} />
          </div>
        ) : held.length === 0 ? (
          <div className="p-8 rounded-[8px] border border-black/10 bg-white text-center">
            <p className="text-base text-black">{t("pile.empty.title")}</p>
            <p className="mt-1 text-xs text-black/45">
              {t("pile.empty.body")}
            </p>
            <Link
              href="/yield"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 transition"
            >
              {t("pile.explore")}
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        ) : layout === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {held.map((v) => (
              <PositionCard key={v.id} view={v} onOpen={() => router.push(`/asset/${v.id}`)} change24h={change24hOf(v)} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {held.map((v) => {
              const value = fromBaseUnits(v.underlyingBalance, v.decimals);
              return (
                <button
                  key={v.id}
                  onClick={() => router.push(`/asset/${v.id}`)}
                  className="group w-full text-left p-5 rounded-[8px] border border-black/10 bg-white hover:border-black/30 transition"
                >
                  <div className="flex items-center gap-4">
                    <AssetIcon src={assetLogoSrc(v.id)} label={assetIconLabel(v.id, v.assetSymbol)} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-base text-black truncate">{v.name}</p>
                      {(() => {
                        const ch = change24hOf(v);
                        if (typeof ch === "number") {
                          const up = ch >= 0;
                          return (
                            <p className="mt-1 text-[10px] lowercase tracking-wide">
                              <span className={up ? "text-emerald-600" : "text-red-600"}>
                                {up ? "+" : ""}
                                {ch.toFixed(2)}% 24h
                              </span>
                              <span className="text-black/45"> · {v.assetSymbol}</span>
                            </p>
                          );
                        }
                        return (
                          <p
                            className={`mt-1 text-[10px] lowercase tracking-wide ${
                              RISK_TONE[v.riskLevel] ?? "text-black/45"
                            }`}
                          >
                            {(v.apy * 100).toFixed(2)}% APY · {v.assetSymbol}
                          </p>
                        );
                      })()}
                    </div>
                    <div className="text-right shrink-0">
                      <LiveAmount value={value} apy={v.apy} variant="md" />
                      <p className="text-[10px] lowercase tracking-wide text-black/40">
                        {t("pile.yourPosition")}
                      </p>
                    </div>
                    <ArrowUpRight
                      size={16}
                      strokeWidth={1.5}
                      className="text-black/40 group-hover:text-black transition shrink-0"
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </motion.section>
    </div>
  );
}
