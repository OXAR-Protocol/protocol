"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { sortMarketItems, type MarketSortKey } from "@oxar/sdk";

import { useYieldPositions } from "@/hooks/use-yield-positions";
import { useFeatures } from "@/hooks/use-features";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { useEarnings } from "@/hooks/use-earnings";
import { useStocksAllowed } from "@/hooks/use-stocks-allowed";
import type { AssetMeta } from "@/lib/yield/assets";
import { fromBaseUnits, getProvider } from "@/lib/yield";
import { useRise } from "@/lib/motion";
import { useT } from "@/lib/i18n";
import { MarketSortSelect } from "@/components/market-sort";
import { usePickSet } from "@/components/pick-set";
import { AssetCard } from "@/components/asset-card";
import { AssetSearchInput } from "@/components/asset-search-input";
import { LoadMoreButton } from "@/components/load-more-button";

/** Canonical order for the sector filter chips (only those present are shown). */
const SECTOR_ORDER = ["tech", "crypto", "finance", "consumer", "health", "energy", "index"] as const;

/** Entries shown per page before "load more" — a catalog of dozens should be
 *  offered a screen at a time, not dumped. */
const PAGE_SIZE = 20;

interface Props {
  /** Price-exposure catalog (stocks or commodities). */
  catalog: readonly AssetMeta[];
  /** Section title, e.g. "Stocks · tokenized". */
  title: string;
  /** Small right-aligned badge, e.g. "non-US" / "physical". */
  badge: string;
  /** Sheet label for one holding, e.g. "Stock" / "Commodity". */
  kind: string;
  /** Sheet sub-line, e.g. "tokenized · non-US" / "physical gold · tokenized". */
  note: string;
  /** Gate behind the Reg S stock geoblock (true for US securities, false for gold). */
  gated?: boolean;
  /** Shares the /yield list/grid toggle. */
  layout?: "list" | "grid";
  /** Show sector filter chips (uses each asset's `sector`). For big catalogs (stocks). */
  filterable?: boolean;
  /** `data-tour` value for the guided walkthrough, placed on the heading row. */
  tourAnchor?: string;
}

/** Buy/sell section for price-exposure assets (tokenized stocks or commodities) —
 *  price-framed cards, list or grid. Gated entries hide where Reg S blocks them. */
export function AssetSection({ catalog, title, badge, gated = false, layout = "list", filterable = false, tourAnchor }: Props) {
  const router = useRouter();
  const { t } = useT();
  const rise = useRise();
  const allowed = useStocksAllowed();
  const features = useFeatures();
  const [sector, setSector] = useState<string>("all");
  // Catalog order by default — see the note in MarketSortSelect.
  const [sort, setSort] = useState<MarketSortKey>("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  // The picked set belongs to the PAGE (see PickSetProvider): this section only
  // offers its own ids to it, so yield, stocks and gold share one bar and one sheet.
  const pickSet = usePickSet();
  const canPickMany = !!pickSet?.enabled;

  // Sectors actually present in this catalog, in canonical order.
  const sectors = useMemo(
    () => SECTOR_ORDER.filter((s) => catalog.some((a) => a.sector === s)),
    [catalog],
  );
  const bySector = useMemo(() => {
    // A feature-gated pilot stays fully dark: hide the card (a disabled ghost row
    // would leak the ticker) until the key is on for this visitor.
    const visible = catalog.filter((a) => {
      const feature = getProvider(a.id)?.feature;
      return !feature || features.includes(feature);
    });
    return filterable && sector !== "all" ? visible.filter((a) => a.sector === sector) : visible;
  }, [catalog, filterable, sector, features]);

  const trimmedQuery = query.trim().toLowerCase();
  const searching = filterable && trimmedQuery.length > 0;

  // Search runs over the whole (sector-filtered) catalog, not just the current
  // page — narrowing by name is the point, so it can't be limited by paging.
  const matched = useMemo(() => {
    if (!searching) return bySector;
    return bySector.filter(
      (a) =>
        a.symbol.toLowerCase().includes(trimmedQuery) ||
        a.name.toLowerCase().includes(trimmedQuery) ||
        a.token.toLowerCase().includes(trimmedQuery),
    );
  }, [bySector, searching, trimmedQuery]);

  const { views } = useYieldPositions();
  const { prices } = useStockPrices(catalog.map((s) => s.mint));
  const charts = useStockCharts();
  const { sources } = useEarnings();

  const viewById = useMemo(() => Object.fromEntries(views.map((v) => [v.id, v])), [views]);
  const earnedById = useMemo(
    () => Object.fromEntries(sources.map((s) => [s.id, s.earned])),
    [sources],
  );

  // Sorting needs what you hold, so it comes after the position hooks. `deposited`
  // is 0 here on purpose: a tokenised stock's pool figure measures the wrapper, not
  // demand for the company, so that column simply doesn't apply (see TrustLine).
  const sorted = useMemo(
    () =>
      sortMarketItems(matched, sort, (a) => {
        const v = viewById[a.id];
        return {
          name: a.name,
          position: v ? fromBaseUnits(v.underlyingBalance, v.decimals) : 0,
          deposited: 0,
        };
      }),
    [matched, sort, viewById],
  );

  // Changing sector or search resets to the first page of the new set. Adjusted
  // during render — React's documented alternative to an Effect for "reset state
  // when an input changes" — rather than a useEffect, which costs an extra
  // render-then-reset round trip.
  const filterKey = `${sector}::${trimmedQuery}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  // While searching, show every match (already a narrow set); otherwise page
  // through the curated catalog order 20 at a time.
  const shown = searching ? sorted : sorted.slice(0, page * PAGE_SIZE);
  const remaining = searching ? 0 : sorted.length - shown.length;

  if (gated && !allowed) return null;

  const card = (s: AssetMeta) => {
    const view = viewById[s.id];
    return (
      <AssetCard
        key={s.id}
        asset={s}
        layout={layout}
        openable={!!view}
        price={prices[s.mint]}
        chart={charts[s.mint]}
        holdings={view ? fromBaseUnits(view.underlyingBalance, view.decimals) : 0}
        earned={earnedById[s.id]}
        showPick={canPickMany && !!view}
        picked={!!pickSet?.picked.has(s.id)}
        onTogglePick={() => pickSet?.toggle(s.id)}
        onOpen={() => router.push(`/asset/${s.id}`)}
      />
    );
  };

  return (
    <motion.section
      {...rise(1)}
      className="mt-10"
    >
      <div data-tour={tourAnchor} className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs lowercase tracking-[0.2em] text-ink/40">{title}</p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] lowercase tracking-wide text-ink/40">{badge}</span>
          {/* No "most deposited" here: see the note on `deposited` above. */}
          <MarketSortSelect value={sort} onChange={setSort} withDeposited={false} />
        </div>
      </div>

      {/* Search — matches against the whole catalog, not just the current page. */}
      {filterable && (
        <div className="mb-3">
          <AssetSearchInput value={query} onChange={setQuery} placeholder={t("asset.search.placeholder")} />
        </div>
      )}

      {/* Sector filter chips — browse a big catalog (stocks) by category. */}
      {filterable && sectors.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {["all", ...sectors].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSector(s)}
              className={`rounded-full border px-3 py-1 text-[11px] lowercase tracking-wide transition ${
                sector === s
                  ? "border-ink bg-ink text-paper"
                  : "border-ink/15 text-ink/55 hover:border-ink/40"
              }`}
            >
              {t(`sector.${s}` as "sector.all")}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink/40">{t("asset.search.empty")}</p>
      ) : layout === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{shown.map(card)}</div>
      ) : (
        <div className="space-y-2">{shown.map(card)}</div>
      )}

      <LoadMoreButton
        remaining={remaining}
        label={t("asset.loadMore", { n: remaining })}
        onClick={() => setPage((p) => p + 1)}
      />
    </motion.section>
  );
}
