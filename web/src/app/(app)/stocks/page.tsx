"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { SectionLabel } from "@/components/section-label";
import { YieldSourceSheet } from "@/components/yield-source-sheet";
import { useYieldPositions, type ProviderView } from "@/hooks/use-yield-positions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { XSTOCKS } from "@/lib/yield/xstocks";
import { fromBaseUnits } from "@/lib/yield";

export default function StocksPage() {
  const { views, refresh } = useYieldPositions();
  const { prices } = useStockPrices(XSTOCKS.map((s) => s.mint));
  const [active, setActive] = useState<ProviderView[] | null>(null);

  const viewById = useMemo(
    () => Object.fromEntries(views.map((v) => [v.id, v])),
    [views],
  );

  return (
    <div className="max-w-[900px] mx-auto pt-8 pb-32 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>Stocks</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl md:text-4xl text-white leading-tight">
          Own a slice of the market
        </h1>
        <p className="mt-3 font-mono text-sm text-white/40 max-w-lg">
          Tokenized US stocks &amp; ETFs. Buy and sell in USDC, hold them in your
          own wallet. Backed 1:1 by real shares · non-US only.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 space-y-2"
      >
        {XSTOCKS.map((s) => {
          const view = viewById[s.id];
          const px = prices[s.mint];
          const holdings = view ? fromBaseUnits(view.underlyingBalance, view.decimals) : 0;
          const up = (px?.change24h ?? 0) >= 0;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!view}
              onClick={() => view && setActive([view])}
              className="w-full flex items-center justify-between p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition-colors text-left disabled:opacity-50"
            >
              <div>
                <p className="font-sans text-base text-white">{s.token}</p>
                <p className="mt-0.5 font-mono text-xs text-white/40">{s.name}</p>
                {holdings > 0 && (
                  <p className="mt-1 font-mono text-[11px] text-accent/80 tabular-nums">
                    you own ${holdings.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-sans text-lg text-white tabular-nums">
                  {px ? `$${px.price.toFixed(2)}` : "—"}
                </p>
                {px && (
                  <p
                    className={`mt-0.5 font-mono text-xs tabular-nums ${
                      up ? "text-emerald-400/80" : "text-red-400/80"
                    }`}
                  >
                    {up ? "+" : ""}
                    {px.change24h.toFixed(2)}% 24h
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </motion.div>

      <div className="mt-10 p-5 rounded-[8px] border border-white/10">
        <p className="font-sans text-sm text-white">Tokenized securities</p>
        <p className="mt-1 font-mono text-xs text-white/40 leading-relaxed">
          Prices track the underlying share and can fall as well as rise. Off-hours
          (nights / weekends) liquidity is thinner and the price may drift from the
          live market. You always hold and sign your own position.
        </p>
      </div>

      {active && (
        <YieldSourceSheet views={active} onClose={() => setActive(null)} onDone={refresh} />
      )}
    </div>
  );
}
