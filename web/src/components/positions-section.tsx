"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpRight } from "lucide-react";

import { PhotoBg } from "@/components/photo-bg";
import { PositionCard } from "@/components/position-card";
import { PositionRow } from "@/components/position-row";
import { PickedSellBar } from "@/components/picked-sell-bar";
import { PositionToolbar, type Filter, type Layout } from "@/components/position-toolbar";
import { useYieldPositions, type ProviderView } from "@/hooks/use-yield-positions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { useEarnedById, useInvestedById } from "@/hooks/use-earnings";
import { useLiveBalances } from "@/hooks/use-live-balances";
import { useFeature } from "@/hooks/use-features";
import { isPriceExposure } from "@/lib/yield/assets";
import { isXStock } from "@/lib/yield/xstocks";
import { isMetal } from "@/lib/yield/metals-catalog";
import { useT } from "@/lib/i18n";

/** Where the list was left, for the length of this visit. */
const FILTER_KEY = "oxar:pile-filter";

/**
 * Everything you hold: filter it, lay it out how you like, tick several to exit
 * together. What the total above is actually made of.
 */
export function PositionsSection() {
  const router = useRouter();
  const { t } = useT();
  const { views, loading, refresh, refreshSilently } = useYieldPositions();
  // Money that moves shows up here without a reload. The socket only triggers the
  // loaders the page already uses, so nothing on screen is computed twice — and it
  // re-reads SILENTLY, so a live update never replaces good numbers with a spinner.
  useLiveBalances(refreshSilently);

  const [layout, setLayout] = useState<Layout>("list");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());

  // Remember the preferred layout across visits.
  useEffect(() => {
    const saved = localStorage.getItem("oxar:pile-layout");
    if (saved === "grid" || saved === "list") setLayout(saved);
  }, []);
  const chooseLayout = (next: Layout) => {
    setLayout(next);
    localStorage.setItem("oxar:pile-layout", next);
  };

  // The filter survives a trip into a position and back — opening one of your stocks
  // and returning to a list of everything reads as the app forgetting what you were
  // looking at. Session, not local: this is where you are in a visit, not a setting.
  useEffect(() => {
    const saved = sessionStorage.getItem(FILTER_KEY);
    if (saved === "all" || saved === "yield" || saved === "stocks" || saved === "metals") {
      setFilter(saved);
    }
  }, []);
  const chooseFilter = (next: Filter) => {
    setFilter(next);
    sessionStorage.setItem(FILTER_KEY, next);
  };

  // Ticking several positions and exiting them together — dark until the key is on.
  const sellingV2 = useFeature("selling-v2");
  const charts = useStockCharts();
  // Profit per position since it was bought — the figures above say what the whole
  // portfolio did; this is what says WHICH holding is dragging.
  const earnedById = useEarnedById();
  const investedById = useInvestedById();

  const allHeld = views.filter((v) => v.underlyingBalance > BigInt(0));
  const held = allHeld.filter((v) => {
    if (filter === "all") return true;
    if (filter === "stocks") return isXStock(v.id);
    if (filter === "metals") return isMetal(v.id);
    return !isPriceExposure(v.id);
  });
  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // 24h change for price-exposure rows — shown instead of a meaningless APY.
  const priceMints = held.filter((v) => isPriceExposure(v.id) && v.heldMint).map((v) => v.heldMint as string);
  const { prices } = useStockPrices(priceMints);
  const change24hOf = (v: ProviderView) =>
    isPriceExposure(v.id) && v.heldMint ? prices[v.heldMint]?.change24h : undefined;

  return (
    <>
      <PositionToolbar
        allHeld={allHeld}
        filter={filter}
        onFilter={chooseFilter}
        layout={layout}
        onLayout={chooseLayout}
        showPickHint={sellingV2 && held.length > 1 && selected.size === 0}
      />

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="animate-spin text-ink/40" size={24} />
        </div>
      ) : held.length === 0 ? (
        <div className="relative overflow-hidden rounded-[8px] border border-ink/10 bg-paper p-8 text-center">
          {/* An empty state is where a photo earns its place: nothing to read yet, and
              the picture says what the words are for. */}
          <PhotoBg src="/art/coin-stacking.webp" scrim="center" position="object-right" opacity="opacity-25" />
          <p className="relative text-base text-ink">{t("pile.empty.title")}</p>
          <p className="relative mt-1 text-xs text-ink/45">{t("pile.empty.body")}</p>
          <Link
            href="/market"
            className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[14px] font-medium lowercase tracking-wide text-paper transition hover:bg-ink/85"
          >
            {t("pile.explore")}
            <ArrowUpRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {held.map((v) => (
            <PositionCard
              key={v.id}
              view={v}
              onOpen={() => router.push(`/asset/${v.id}`)}
              change24h={change24hOf(v)}
              earned={earnedById[v.id]}
              invested={investedById[v.id]}
              picked={selected.has(v.id)}
              onTogglePick={sellingV2 ? () => toggleSelected(v.id) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className={`space-y-2 ${selected.size > 0 ? "pb-[calc(9rem+env(safe-area-inset-bottom))]" : ""}`}>
          {held.map((v) => (
            <PositionRow
              key={v.id}
              view={v}
              onOpen={() => router.push(`/asset/${v.id}`)}
              change24h={change24hOf(v)}
              chart={v.heldMint ? charts[v.heldMint] : undefined}
              earned={earnedById[v.id]}
              picked={selected.has(v.id)}
              onTogglePick={sellingV2 ? () => toggleSelected(v.id) : undefined}
            />
          ))}
        </div>
      )}

      {sellingV2 && (
        <PickedSellBar
          views={held.filter((v) => selected.has(v.id))}
          allHeld={allHeld}
          onOutcome={(stillSelected) => setSelected(stillSelected)}
          onDone={refresh}
        />
      )}
    </>
  );
}
