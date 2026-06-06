"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { StockSheet } from "@/components/stock-sheet";
import { useYieldPositions } from "@/hooks/use-yield-positions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useEarnings } from "@/hooks/use-earnings";
import { useStocksAllowed } from "@/hooks/use-stocks-allowed";
import { XSTOCKS, type XStockMeta } from "@/lib/yield/xstocks";
import { fromBaseUnits } from "@/lib/yield";

/** Tokenized stocks as a section on /yield — price-framed, buy/sell in USDC.
 *  Hidden entirely where Reg S blocks the offering (see useStocksAllowed). */
export function StocksSection() {
  const allowed = useStocksAllowed();
  const { views, refresh } = useYieldPositions();
  const { prices } = useStockPrices(XSTOCKS.map((s) => s.mint));
  const { sources } = useEarnings();
  const [active, setActive] = useState<XStockMeta | null>(null);

  const viewById = useMemo(() => Object.fromEntries(views.map((v) => [v.id, v])), [views]);
  const earnedById = useMemo(
    () => Object.fromEntries(sources.map((s) => [s.id, s.earned])),
    [sources],
  );

  if (!allowed) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.18 }}
      className="mt-10"
    >
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">
          Stocks · tokenized
        </p>
        <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
          non-US
        </span>
      </div>

      <div className="space-y-2">
        {XSTOCKS.map((s) => {
          const view = viewById[s.id];
          const px = prices[s.mint];
          const holdings = view ? fromBaseUnits(view.underlyingBalance, view.decimals) : 0;
          const earned = earnedById[s.id];
          const up = (px?.change24h ?? 0) >= 0;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!view}
              onClick={() => view && setActive(s)}
              className="w-full flex items-center justify-between p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition-colors text-left disabled:opacity-50"
            >
              <div>
                <p className="font-sans text-base text-white">{s.token}</p>
                <p className="mt-0.5 font-mono text-xs text-white/40">{s.name}</p>
                {holdings > 0 && (
                  <p className="mt-1 font-mono text-[11px] text-accent/80 tabular-nums">
                    you own ${holdings.toFixed(2)}
                    {typeof earned === "number" && (
                      <span className={earned >= 0 ? "text-emerald-400/70" : "text-red-400/70"}>
                        {" · "}
                        {earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)}
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-sans text-lg text-white tabular-nums">
                  {px ? `$${px.price.toFixed(2)}` : "—"}
                </p>
                {px && (
                  <p className={`mt-0.5 font-mono text-xs tabular-nums ${up ? "text-emerald-400/80" : "text-red-400/80"}`}>
                    {up ? "+" : ""}
                    {px.change24h.toFixed(2)}% 24h
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {active && viewById[active.id] && (
        <StockSheet
          view={viewById[active.id]}
          token={active.token}
          name={active.name}
          price={prices[active.mint]}
          earned={earnedById[active.id]}
          onClose={() => setActive(null)}
          onDone={refresh}
        />
      )}
    </motion.section>
  );
}
