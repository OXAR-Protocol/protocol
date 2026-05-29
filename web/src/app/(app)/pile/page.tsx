"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowUpRight } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { YieldSourceSheet } from "@/components/yield-source-sheet";
import {
  useYieldPositions,
  type ProviderView,
} from "@/hooks/use-yield-positions";
import { RISK_TONE, fromBaseUnits } from "@/lib/yield";

export default function PilePage() {
  const { views, totalValue, loading, refresh } = useYieldPositions();
  const [active, setActive] = useState<ProviderView | null>(null);

  return (
    <div className="max-w-[900px] mx-auto pt-8 pb-32 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>Your pile</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl md:text-4xl text-white leading-tight">
          Everything you've got working
        </h1>
        <p className="mt-3 font-mono text-sm text-white/40 max-w-lg">
          Your live positions across every source. Tap one to deposit more or
          withdraw — funds stay in your own on-chain position.
        </p>
      </motion.div>

      {/* Total */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-8 p-6 rounded-[8px] border border-white/10"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">
          Total balance
        </p>
        <div className="mt-2">
          {loading ? (
            <Loader2 className="animate-spin text-white/30" size={28} />
          ) : (
            <span className="font-sans text-4xl font-light text-white tabular-nums">
              ${totalValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
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
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
          Sources
        </p>
        <div className="space-y-2">
          {views.map((v) => {
            const value = fromBaseUnits(v.underlyingBalance, v.decimals);
            return (
              <button
                key={v.id}
                onClick={() => setActive(v)}
                className="group w-full text-left p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-base text-white truncate">
                      {v.name}
                    </p>
                    <p
                      className={`mt-1 font-mono text-[10px] uppercase tracking-wide ${
                        RISK_TONE[v.riskLevel] ?? "text-white/40"
                      }`}
                    >
                      {(v.apy * 100).toFixed(2)}% APY
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-sans text-xl text-white tabular-nums">
                      ${value.toFixed(2)}
                    </p>
                    <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">
                      {value > 0 ? "your position" : "tap to deposit"}
                    </p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    strokeWidth={1.5}
                    className="text-white/30 group-hover:text-white transition shrink-0"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </motion.section>

      {active && (
        <YieldSourceSheet
          view={active}
          onClose={() => setActive(null)}
          onDone={refresh}
        />
      )}
    </div>
  );
}
