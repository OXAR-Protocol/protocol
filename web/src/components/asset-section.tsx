"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import { Sparkline } from "@/components/sparkline";
import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { assetLogoSrc } from "@/lib/yield/asset-logo";
import { useYieldPositions } from "@/hooks/use-yield-positions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { useEarnings } from "@/hooks/use-earnings";
import { useStocksAllowed } from "@/hooks/use-stocks-allowed";
import type { AssetMeta } from "@/lib/yield/assets";
import { fromBaseUnits } from "@/lib/yield";
import { useT } from "@/lib/i18n";

/** Canonical order for the sector filter chips (only those present are shown). */
const SECTOR_ORDER = ["tech", "crypto", "finance", "consumer", "health", "index"] as const;

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
}

/** Buy/sell section for price-exposure assets (tokenized stocks or commodities) —
 *  price-framed cards, list or grid. Gated entries hide where Reg S blocks them. */
export function AssetSection({ catalog, title, badge, gated = false, layout = "list", filterable = false }: Props) {
  const router = useRouter();
  const { t } = useT();
  const allowed = useStocksAllowed();
  const [sector, setSector] = useState<string>("all");

  // Sectors actually present in this catalog, in canonical order.
  const sectors = useMemo(
    () => SECTOR_ORDER.filter((s) => catalog.some((a) => a.sector === s)),
    [catalog],
  );
  const shown = useMemo(
    () => (filterable && sector !== "all" ? catalog.filter((a) => a.sector === sector) : catalog),
    [catalog, filterable, sector],
  );
  const { views } = useYieldPositions();
  const { prices } = useStockPrices(catalog.map((s) => s.mint));
  const charts = useStockCharts();
  const { sources } = useEarnings();

  const viewById = useMemo(() => Object.fromEntries(views.map((v) => [v.id, v])), [views]);
  const earnedById = useMemo(
    () => Object.fromEntries(sources.map((s) => [s.id, s.earned])),
    [sources],
  );

  if (gated && !allowed) return null;

  const card = (s: AssetMeta) => {
    const view = viewById[s.id];
    const px = prices[s.mint];
    const holdings = view ? fromBaseUnits(view.underlyingBalance, view.decimals) : 0;
    const earned = earnedById[s.id];
    const up = (px?.change24h ?? 0) >= 0;
    const chart = charts[s.mint];
    const spark =
      chart && chart.length > 1 ? (
        <Sparkline values={chart} height={32} className={`w-full h-8 ${up ? "text-emerald-400/40" : "text-red-400/40"}`} />
      ) : null;

    const price = (
      <p className="text-lg text-black tabular-nums">
        {px ? `$${px.price.toFixed(2)}` : "—"}
      </p>
    );
    const change = px ? (
      <p className={`mt-0.5 text-xs tabular-nums ${up ? "text-emerald-600" : "text-red-600"}`}>
        {up ? "+" : ""}
        {px.change24h.toFixed(2)}% 24h
      </p>
    ) : null;
    const owned = holdings > 0 ? (
      <p className="mt-1 text-[11px] text-[#3c05c7]/80 tabular-nums">
        you own ${holdings.toFixed(2)}
        {typeof earned === "number" && (
          <span className={earned >= 0 ? "text-emerald-400/70" : "text-red-400/70"}>
            {" · "}
            {earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)}
          </span>
        )}
      </p>
    ) : null;
    const head = (
      <div className="flex items-center gap-3 min-w-0">
        <AssetIcon src={assetLogoSrc(s.id)} label={s.symbol || s.token} size={36} />
        <div className="min-w-0">
          <p className="text-base text-black">{s.token}</p>
          <p className="mt-0.5 text-xs text-black/45 truncate">{s.name}</p>
        </div>
      </div>
    );

    if (layout === "grid") {
      return (
        <button
          key={s.id}
          type="button"
          disabled={!view}
          onClick={() => view && router.push(`/asset/${s.id}`)}
          className="group relative isolate overflow-hidden p-5 rounded-[8px] border border-black/10 hover:border-black/30 transition-colors text-left disabled:opacity-50 min-h-[120px] flex flex-col justify-between"
        >
          <BanknoteBg seed={s.id} />
          {head}
          {spark && <div className="my-2">{spark}</div>}
          <div className={spark ? "mt-1" : "mt-3"}>
            {price}
            {change}
            {owned}
          </div>
        </button>
      );
    }
    return (
      <button
        key={s.id}
        type="button"
        disabled={!view}
        onClick={() => view && router.push(`/asset/${s.id}`)}
        className="group relative isolate overflow-hidden w-full flex items-center justify-between p-5 rounded-[8px] border border-black/10 hover:border-black/30 transition-colors text-left disabled:opacity-50"
      >
        <BanknoteBg seed={s.id} />
        <div className="min-w-0">
          {head}
          {owned}
        </div>
        {spark && <div className="hidden sm:block flex-1 mx-4 max-w-[140px]">{spark}</div>}
        <div className="text-right">
          {price}
          {change}
        </div>
      </button>
    );
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="mt-10"
    >
      <div className="flex items-baseline justify-between mb-3">
        <p className="text-xs lowercase tracking-[0.2em] text-black/40">{title}</p>
        <span className="text-[10px] lowercase tracking-wide text-black/40">{badge}</span>
      </div>

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
                  ? "border-black bg-black text-white"
                  : "border-black/15 text-black/55 hover:border-black/40"
              }`}
            >
              {t(`sector.${s}` as "sector.all")}
            </button>
          ))}
        </div>
      )}

      {layout === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{shown.map(card)}</div>
      ) : (
        <div className="space-y-2">{shown.map(card)}</div>
      )}
    </motion.section>
  );
}
