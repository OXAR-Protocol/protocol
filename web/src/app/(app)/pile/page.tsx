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
import { floorTo, formatUsdAmount } from "@oxar/sdk";
import { isPriceExposure } from "@/lib/yield/assets";
import { isXStock } from "@/lib/yield/xstocks";
import { isGold } from "@/lib/yield/gold";
import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useT } from "@/lib/i18n";
import { useFeature } from "@/hooks/use-features";
import { useBulkSell } from "@/hooks/use-bulk-sell";
import { BulkSellBar } from "@/components/bulk-sell-bar";
import { ActivityFeed } from "@/components/activity-feed";
import { HoverChart } from "@/components/hover-chart";
import { Sparkline } from "@/components/sparkline";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { useActivity } from "@/hooks/use-activity";
import { usePortfolioHistory } from "@/hooks/use-portfolio-history";

type Layout = "list" | "grid";
/** Narrow the position list. "traded" = you've bought or sold it, not merely hold it. */
type Filter = "all" | "yield" | "stocks" | "gold" | "traded";

export default function PilePage() {
  const router = useRouter();
  const { t } = useT();
  const { views, totalValue, loading, refresh } = useYieldPositions();
  const [layout, setLayout] = useState<Layout>("list");
  // Ticking several positions and exiting them together — dark until the key is on.
  const sellingV2 = useFeature("selling-v2");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const bulk = useBulkSell();
  // Reconstructed from on-chain history + daily prices — see /api/portfolio-history.
  const history = usePortfolioHistory(90);
  // One batched request covers every card's sparkline (see /api/stock-charts).
  const charts = useStockCharts();
  // Which assets this wallet has actually traded — drives the "traded" filter.
  const { events } = useActivity();
  const tradedMints = new Set(events.map((e) => e.mint).filter(Boolean) as string[]);
  const [filter, setFilter] = useState<Filter>("all");

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
  const allHeld = views.filter((v) => v.underlyingBalance > BigInt(0));
  const held = allHeld.filter((v) => {
    if (filter === "all") return true;
    if (filter === "stocks") return isXStock(v.id);
    if (filter === "gold") return isGold(v.id);
    if (filter === "yield") return !isPriceExposure(v.id);
    return !!v.heldMint && tradedMints.has(v.heldMint);
  });

  // 24h price change for price-exposure positions (stocks/gold) — shown instead
  // of "0.00% APY" on those cards.
  const priceMints = held
    .filter((v) => isPriceExposure(v.id) && v.heldMint)
    .map((v) => v.heldMint as string);
  const { prices } = useStockPrices(priceMints);
  // Ticker for one unit — the name carries it, e.g. "Broadcom (AVGOx)".
  const unitOf = (v: ProviderView) => v.name.match(/\(([^)]+)\)/)?.[1] ?? v.assetSymbol;
  const change24hOf = (v: ProviderView) =>
    isPriceExposure(v.id) && v.heldMint ? prices[v.heldMint]?.change24h : undefined;

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectedViews = held.filter((v) => selected.has(v.id));
  const selectedUsd = selectedViews.reduce(
    (sum, v) => sum + fromBaseUnits(v.underlyingBalance, v.decimals),
    0,
  );

  const sellSelected = async () => {
    // Read the RETURNED outcomes, not `bulk.done` — that's state captured at render
    // and still holds the previous run's value at this point.
    const outcomes = await bulk.sellAll(
      selectedViews.map((v) => ({
        id: v.id,
        shares: v.shares,
        valueUsd: fromBaseUnits(v.underlyingBalance, v.decimals),
      })),
    );
    // Keep the failed ones ticked: they are what the user still has to deal with.
    setSelected(new Set(outcomes.filter((o) => !o.ok).map((o) => o.id)));
    refresh();
  };

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
        <div>
          <SectionLabel>portfolio</SectionLabel>
          <h1 className="mt-4 text-[clamp(26px,4vw,44px)] text-black leading-[1.04] tracking-[-0.04em] lowercase">
            {t("pile.title")}
          </h1>
          <p className="mt-3 max-w-lg text-sm text-black/45">
            {t("pile.subtitle")}
          </p>
        </div>
      </motion.div>

      {/* Total */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative mt-8 overflow-hidden p-6 rounded-[8px] border border-black/10 bg-white"
      >
        <p className="text-xs lowercase tracking-[0.2em] text-black/40">
          {t("pile.total")}
        </p>
        <div className="mt-2">
          {loading ? (
            <Loader2 className="animate-spin text-black/40" size={28} />
          ) : (
            <LiveAmount value={totalValue} apy={blendedApy} variant="lg" />
          )}
        </div>

        {/* The line gets the full width of the card and nothing behind it. It is
            data, not decoration — the photograph it used to sit on was reading as
            texture over the one thing the card exists to show. */}
        {history.points.length > 1 && (
          <div className="-mx-6 mt-5 -mb-6">
            <HoverChart
              values={history.points.map((p) => p.usd)}
              format={(v) => `$${formatUsdAmount(v)}`}
              height={110}
              className="text-[#3c05c7]"
              fill
            />
            <p className="px-6 pb-4 pt-2 text-[10px] lowercase tracking-wide text-black/30">
              {t("pile.chartRange", { n: String(history.points.length) })}
            </p>
          </div>
        )}

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
          {allHeld.length > 0 && (
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

        {/* Say the feature exists. It was discoverable only by noticing a small
            button on hover, which is the same as not existing. */}
        {sellingV2 && held.length > 1 && selected.size === 0 && (
          <p className="mb-2 text-[11px] lowercase tracking-wide text-black/35">
            {t("bulk.hint")}
          </p>
        )}

        {/* Narrow the list. Only offered where there's something to narrow. */}
        {allHeld.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {(["all", "yield", "stocks", "gold", "traded"] as const)
              .filter((f) => {
                if (f === "all" || f === "traded") return true;
                if (f === "stocks") return allHeld.some((v) => isXStock(v.id));
                if (f === "gold") return allHeld.some((v) => isGold(v.id));
                return allHeld.some((v) => !isPriceExposure(v.id));
              })
              .map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-full px-3 py-1 text-[11px] lowercase tracking-wide transition ${
                    filter === f
                      ? "bg-black text-white"
                      : "bg-black/[0.05] text-black/55 hover:text-black"
                  }`}
                >
                  {t(`pile.filter.${f}` as "pile.filter.all")}
                </button>
              ))}
          </div>
        )}

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
          <div className={`space-y-2 ${selected.size > 0 ? "pb-24" : ""}`}>
            {held.map((v) => {
              const value = fromBaseUnits(v.underlyingBalance, v.decimals);
              return (
                <button
                  key={v.id}
                  onClick={() => router.push(`/asset/${v.id}`)}
                  className={`group relative isolate w-full overflow-hidden rounded-[8px] border bg-white p-5 text-left transition-colors ${
                    selected.has(v.id)
                      ? "border-black/40 ring-1 ring-black/10"
                      : "border-black/10 hover:border-black/30"
                  }`}
                >
                  <BanknoteBg seed={v.id} />
                  <div className="flex items-center gap-4">
                    {/* Same shape as the browse rows on /yield: ticker leads, name
                        underneath, the chart in the middle, value on the right. */}
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <AssetIcon src={assetLogoSrc(v.id)} label={assetIconLabel(v.id, v.assetSymbol)} size={36} />
                      <div className="min-w-0">
                        <p className="text-base text-black">{unitOf(v)}</p>
                        <p className="mt-0.5 truncate text-xs text-black/45">{v.name.replace(/\s*\([^)]*\)$/, "")}</p>
                        {/* How much you own, not only what it's worth. */}
                        {isPriceExposure(v.id) && v.heldDecimals !== undefined && v.shares > BigInt(0) && (
                          <p className="mt-1 text-[11px] tabular-nums text-[#3c05c7]/80">
                            {floorTo(Number(v.shares) / 10 ** v.heldDecimals, 6)} {unitOf(v)}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* The same batched series the grid cards use — one request for
                        every row, so a chart per position costs nothing extra. */}
                    {isPriceExposure(v.id) && v.heldMint && (charts[v.heldMint]?.length ?? 0) > 1 && (
                      <div className="mx-4 hidden max-w-[140px] flex-1 sm:block">
                        <Sparkline
                          values={charts[v.heldMint]!}
                          className={(change24hOf(v) ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"}
                        />
                      </div>
                    )}

                    {/* Collecting a set, not ticking a table — so it reads as an
                        action on the right, where the other actions are. */}
                    {sellingV2 && (
                      <span
                        role="checkbox"
                        aria-checked={selected.has(v.id)}
                        tabIndex={0}
                        aria-label={t("bulk.select", { name: v.name })}
                        onClick={(e) => {
                          // The row navigates; picking must not.
                          e.stopPropagation();
                          toggleSelected(v.id);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " " || e.key === "Enter") {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleSelected(v.id);
                          }
                        }}
                        className={`inline-flex shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-[11px] lowercase tracking-wide transition ${
                          selected.has(v.id)
                            ? "border-black bg-black text-white"
                            : "border-black/15 text-black/50 hover:border-black/40 hover:text-black"
                        }`}
                      >
                        {selected.has(v.id) ? t("bulk.picked") : t("bulk.pick")}
                      </span>
                    )}

                    <div className="shrink-0 text-right">
                      <LiveAmount value={value} apy={v.apy} variant="md" />
                      {(() => {
                        const ch = change24hOf(v);
                        if (typeof ch === "number") {
                          return (
                            <p className={`text-[11px] tabular-nums ${ch >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                              {ch >= 0 ? "+" : ""}
                              {ch.toFixed(2)}% 24h
                            </p>
                          );
                        }
                        return (
                          <p className={`text-[11px] lowercase tracking-wide ${RISK_TONE[v.riskLevel] ?? "text-black/45"}`}>
                            {(v.apy * 100).toFixed(2)}% APY
                          </p>
                        );
                      })()}
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

      {sellingV2 && (
        <BulkSellBar
          picked={selectedViews.map((v) => ({ id: v.id, symbol: v.assetSymbol }))}
          selectedCount={selected.size}
          totalUsd={selectedUsd}
          state={bulk.state}
          done={bulk.done.map((d) => ({
            ...d,
            id: allHeld.find((v) => v.id === d.id)?.name ?? d.id,
          }))}
          onSell={sellSelected}
          onClear={() => {
            setSelected(new Set());
            bulk.reset();
          }}
        />
      )}

      {/* History lives where the positions are, not on the home glance. */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-10"
      >
        <p className="mb-3 text-xs lowercase tracking-[0.2em] text-black/40">
          {t("pile.history")}
        </p>
        <ActivityFeed />
      </motion.section>
    </div>
  );
}
