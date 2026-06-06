"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { StockSheet } from "@/components/stock-sheet";
import { Sparkline } from "@/components/sparkline";
import { useYieldPositions } from "@/hooks/use-yield-positions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useStockCharts } from "@/hooks/use-stock-charts";
import { useEarnings } from "@/hooks/use-earnings";
import { useStocksAllowed } from "@/hooks/use-stocks-allowed";
import type { AssetMeta } from "@/lib/yield/assets";
import { fromBaseUnits } from "@/lib/yield";

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
}

/** Buy/sell section for price-exposure assets (tokenized stocks or commodities) —
 *  price-framed cards, list or grid. Gated entries hide where Reg S blocks them. */
export function AssetSection({ catalog, title, badge, kind, note, gated = false, layout = "list" }: Props) {
  const allowed = useStocksAllowed();
  const { views, refresh } = useYieldPositions();
  const { prices } = useStockPrices(catalog.map((s) => s.mint));
  const charts = useStockCharts();
  const { sources } = useEarnings();
  const [active, setActive] = useState<AssetMeta | null>(null);

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
      <p className="font-sans text-lg text-white tabular-nums">
        {px ? `$${px.price.toFixed(2)}` : "—"}
      </p>
    );
    const change = px ? (
      <p className={`mt-0.5 font-mono text-xs tabular-nums ${up ? "text-emerald-400/80" : "text-red-400/80"}`}>
        {up ? "+" : ""}
        {px.change24h.toFixed(2)}% 24h
      </p>
    ) : null;
    const owned = holdings > 0 ? (
      <p className="mt-1 font-mono text-[11px] text-accent/80 tabular-nums">
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
      <div>
        <p className="font-sans text-base text-white">{s.token}</p>
        <p className="mt-0.5 font-mono text-xs text-white/40">{s.name}</p>
      </div>
    );

    if (layout === "grid") {
      return (
        <button
          key={s.id}
          type="button"
          disabled={!view}
          onClick={() => view && setActive(s)}
          className="p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition-colors text-left disabled:opacity-50 min-h-[120px] flex flex-col justify-between"
        >
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
        onClick={() => view && setActive(s)}
        className="w-full flex items-center justify-between p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition-colors text-left disabled:opacity-50"
      >
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
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">{title}</p>
        <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">{badge}</span>
      </div>

      {layout === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{catalog.map(card)}</div>
      ) : (
        <div className="space-y-2">{catalog.map(card)}</div>
      )}

      {active && viewById[active.id] && (
        <StockSheet
          view={viewById[active.id]}
          token={active.token}
          name={active.name}
          kind={kind}
          note={note}
          price={prices[active.mint]}
          earned={earnedById[active.id]}
          onClose={() => setActive(null)}
          onDone={refresh}
        />
      )}
    </motion.section>
  );
}
