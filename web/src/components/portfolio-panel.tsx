"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowUpRight } from "lucide-react";

import { PositionCard } from "@/components/position-card";
import { PositionRow } from "@/components/position-row";
import { PickedSellBar } from "@/components/picked-sell-bar";
import { PositionToolbar, type Filter, type Layout } from "@/components/position-toolbar";
import {
  useYieldPositions,
  type ProviderView,
} from "@/hooks/use-yield-positions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { groupByDay, summarizeDays, activeDays, utcDayStart } from "@oxar/sdk";
import { isPriceExposure } from "@/lib/yield/assets";
import { isXStock } from "@/lib/yield/xstocks";
import { isGold } from "@/lib/yield/gold";
import { useT } from "@/lib/i18n";
import { useFeature } from "@/hooks/use-features";
import { PortfolioChart, type Range } from "@/components/portfolio-chart";
import { DayHistory } from "@/components/day-history";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { useActivity } from "@/hooks/use-activity";
import { useLiveBalances } from "@/hooks/use-live-balances";
import { usePortfolioHistory } from "@/hooks/use-portfolio-history";



/**
 * Everything about the money you already have: its shape over time, the positions
 * themselves, and the history that produced them.
 *
 * It's a component rather than a page because home and "portfolio" were the same
 * object twice — both led with the total and both listed the positions. One of them
 * had to be the real one, and the answer is: wherever the user lands.
 */
export function PortfolioPanel() {
  const router = useRouter();
  const { t, locale } = useT();
  const { views, loading, refresh, refreshSilently } = useYieldPositions();
  // Money that moves shows up here without a reload. The socket only triggers the
  // loaders the page already uses, so nothing on screen is computed twice — and it
  // re-reads SILENTLY, so a live update never replaces good numbers with a spinner.
  useLiveBalances(refreshSilently);
  const [layout, setLayout] = useState<Layout>("list");

  // Remember the preferred layout across visits.
  useEffect(() => {
    const saved = localStorage.getItem("oxar:pile-layout");
    if (saved === "grid" || saved === "list") setLayout(saved);
  }, []);
  const chooseLayout = (next: Layout) => {
    setLayout(next);
    localStorage.setItem("oxar:pile-layout", next);
  };

  // Ticking several positions and exiting them together — dark until the key is on.
  const sellingV2 = useFeature("selling-v2");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [filter, setFilter] = useState<Filter>("all");
  // Reconstructed from on-chain history + daily prices — see /api/portfolio-history.
  const [range, setRange] = useState<Range>(30);
  const history = usePortfolioHistory(range);
  // Deep enough for a year of ordinary use; the route caps it.
  const { events, loading: loadingEvents } = useActivity(500);

  // The day list's window comes from the value series, not the clock: it is by
  // definition the stretch the chart is drawing, so the two can't disagree about
  // what "30 days" means.
  const days = useMemo(() => {
    const cutoff = history.points.length ? utcDayStart(history.points[0]!.t) : 0;
    return groupByDay(events.filter((e) => e.timestamp >= cutoff), history.points);
  }, [events, history.points]);
  const rangeStats = useMemo(() => summarizeDays(days), [days]);
  // The summary reads EVERY day; the list shows only the ones something happened on.
  // A quiet day repeats what the chart already draws, and there is one per calendar
  // day — pages of "$0.00" rows burying the few that record a decision.
  const listedDays = useMemo(() => activeDays(days), [days]);
  // One batched request covers every card's sparkline (see /api/stock-charts).
  const charts = useStockCharts();
  // Which assets this wallet has actually traded — drives the "traded" filter.
  // Same events the history below reads: one request, two uses.
  const tradedMints = new Set(events.map((e) => e.mint).filter(Boolean) as string[]);

  // Pile is the portfolio: only sources where you actually hold a position.
  const allHeld = views.filter((v) => v.underlyingBalance > BigInt(0));
  const held = allHeld.filter((v) => {
    if (filter === "all") return true;
    if (filter === "stocks") return isXStock(v.id);
    if (filter === "gold") return isGold(v.id);
    if (filter === "yield") return !isPriceExposure(v.id);
    return !!v.heldMint && tradedMints.has(v.heldMint);
  });
  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 24h change for price-exposure rows — shown instead of a meaningless APY.
  const priceMints = held
    .filter((v) => isPriceExposure(v.id) && v.heldMint)
    .map((v) => v.heldMint as string);
  const { prices } = useStockPrices(priceMints);
  const change24hOf = (v: ProviderView) =>
    isPriceExposure(v.id) && v.heldMint ? prices[v.heldMint]?.change24h : undefined;

  const selectedViews = held.filter((v) => selected.has(v.id));


  return (
    <>

      {/* The line gets the full width of the card and nothing behind it. It is
          data, not decoration. */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative mt-8 overflow-hidden rounded-[8px] border border-black/10 bg-white p-6"
      >
        <PortfolioChart
          points={history.points}
          stats={rangeStats}
          range={range}
          onRangeChange={setRange}
          loading={history.loading}
          locale={locale}
        />
      </motion.section>

      {/* Per-source positions */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8"
      >
        <PositionToolbar
          allHeld={allHeld}
          filter={filter}
          onFilter={setFilter}
          layout={layout}
          onLayout={chooseLayout}
          showPickHint={sellingV2 && held.length > 1 && selected.size === 0}
        />

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
              href="/market"
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 transition"
            >
              {t("pile.explore")}
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </Link>
          </div>
        ) : layout === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {held.map((v) => (
              <PositionCard
                key={v.id}
                view={v}
                onOpen={() => router.push(`/asset/${v.id}`)}
                change24h={change24hOf(v)}
                picked={selected.has(v.id)}
                onTogglePick={sellingV2 ? () => toggleSelected(v.id) : undefined}
              />
            ))}
          </div>
        ) : (
          <div className={`space-y-2 ${selected.size > 0 ? "pb-24" : ""}`}>
            {held.map((v) => (
              <PositionRow
                key={v.id}
                view={v}
                onOpen={() => router.push(`/asset/${v.id}`)}
                change24h={change24hOf(v)}
                chart={v.heldMint ? charts[v.heldMint] : undefined}
                picked={selected.has(v.id)}
                onTogglePick={sellingV2 ? () => toggleSelected(v.id) : undefined}
              />
            ))}
          </div>
        )}
      </motion.section>

      {sellingV2 && (
        <PickedSellBar
          views={selectedViews}
          allHeld={allHeld}
          onOutcome={(stillSelected) => setSelected(stillSelected)}
          onDone={refresh}
        />
      )}

      {/* History lives where the positions are, not on the home glance. */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-10"
        data-tour="history"
      >
        <p className="mb-3 text-xs lowercase tracking-[0.2em] text-black/40">{t("pile.history")}</p>
        {/* Read as days, not as a stream, and over the SAME range as the chart above —
            the history is the portfolio over time, so it belongs beside it rather than
            on a page of its own. */}
        {loadingEvents ? (
          <div className="flex justify-center py-10 text-black/25">
            <Loader2 size={16} className="animate-spin" />
          </div>
        ) : (
          <DayHistory days={listedDays} locale={locale} />
        )}
      </motion.section>
    </>
  );
}
