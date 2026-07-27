"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, X } from "lucide-react";

import { formatUsdAmount, floorToCents, normalizeDecimalInput } from "@oxar/sdk";

import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useT } from "@/lib/i18n";

export interface AllocationRow {
  id: string;
  name: string;
  symbol: string;
  /** Sell: what this position is worth. Buy: unused — the budget is shared. */
  maxUsd?: number;
}

interface Props {
  mode: "buy" | "sell";
  rows: AllocationRow[];
  /** Buy only: the money available to split across the rows. */
  budgetUsd?: number;
  busy: boolean;
  /** "2 of 3" while it runs — each asset is its own transaction. */
  progress?: string | null;
  error?: string | null;
  onConfirm: (amounts: Record<string, number>) => void;
  onClose: () => void;
}

const FRACTIONS = [0.25, 0.5, 0.75, 1] as const;

/**
 * How much of each. One sheet for both directions, because it is the same
 * question asked twice: selling splits each position, buying splits one budget.
 *
 * Amounts are per-asset dollars, and the sheet never invents them — a row left
 * empty is simply not traded, rather than being given an "even share" the user
 * didn't ask for. For buying it shows what's left of the budget instead of
 * silently clamping, so an over-allocation is visible before it's signed.
 */
export function AllocationSheet({
  mode,
  rows,
  budgetUsd,
  busy,
  progress,
  error,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useT();
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const valueOf = (id: string) => Math.max(0, parseFloat(amounts[id] ?? "") || 0);
  const allocated = rows.reduce((sum, r) => sum + valueOf(r.id), 0);
  const remaining = budgetUsd !== undefined ? budgetUsd - allocated : 0;
  const overBudget = budgetUsd !== undefined && remaining < -0.005;
  const nothing = allocated <= 0;

  const setAmount = (id: string, v: string) =>
    setAmounts((prev) => ({ ...prev, [id]: normalizeDecimalInput(v) }));

  /** Sell: a fraction of THIS position. Buy: a fraction of what's still unspent. */
  const applyFraction = (row: AllocationRow, f: number) => {
    const base =
      mode === "sell"
        ? row.maxUsd ?? 0
        : Math.max(0, (budgetUsd ?? 0) - (allocated - valueOf(row.id)));
    setAmount(row.id, String(floorToCents(base * f)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[88vh] w-full max-w-[520px] overflow-auto rounded-t-[16px] border border-black/10 bg-white p-5 sm:rounded-[16px]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] text-black">
              {t(mode === "sell" ? "alloc.sellTitle" : "alloc.buyTitle")}
            </p>
            {budgetUsd !== undefined && (
              <p className={`mt-0.5 text-[12px] tabular-nums ${overBudget ? "text-red-600" : "text-black/45"}`}>
                {t("alloc.left", { usd: `$${formatUsdAmount(Math.abs(remaining))}` })}
                {overBudget ? ` — ${t("alloc.over")}` : ""}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="text-black/35 transition hover:text-black disabled:opacity-40">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="rounded-[10px] border border-black/10 p-3">
              <div className="flex items-center gap-3">
                <AssetIcon src={assetLogoSrc(r.id)} label={assetIconLabel(r.id, r.symbol)} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-black">{r.name}</p>
                  {mode === "sell" && r.maxUsd !== undefined && (
                    <p className="text-[11px] tabular-nums text-black/40">
                      {t("alloc.youHave", { usd: `$${formatUsdAmount(r.maxUsd)}` })}
                    </p>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-black/35">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amounts[r.id] ?? ""}
                    onChange={(e) => setAmount(r.id, e.target.value)}
                    placeholder="0"
                    disabled={busy}
                    className="w-24 border-b border-black/15 bg-transparent py-0.5 text-right text-[17px] tabular-nums text-black outline-none focus:border-black/40"
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {FRACTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    disabled={busy}
                    onClick={() => applyFraction(r, f)}
                    className="rounded-full bg-black/[0.05] px-2.5 py-1 text-[11px] lowercase tracking-wide text-black/55 transition hover:text-black disabled:opacity-40"
                  >
                    {f * 100}%
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="mt-3 text-center text-[12px] text-red-600">{error}</p>}

        <button
          type="button"
          disabled={busy || nothing || overBudget}
          onClick={() =>
            onConfirm(Object.fromEntries(rows.map((r) => [r.id, valueOf(r.id)]).filter(([, v]) => (v as number) > 0)))
          }
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-[14px] lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-30"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {busy && progress
            ? progress
            : t(mode === "sell" ? "alloc.confirmSell" : "alloc.confirmBuy", {
                usd: `$${formatUsdAmount(allocated)}`,
              })}
        </button>

        {/* Several assets means several transactions — said once, before signing. */}
        <p className="mt-2 text-center text-[11px] text-black/35">
          {t("alloc.note", { n: String(rows.length) })}
        </p>
      </motion.div>
    </div>
  );
}
