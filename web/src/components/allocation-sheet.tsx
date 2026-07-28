"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Loader2, X } from "lucide-react";

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

/** How one row's transaction ended. Absent = not attempted yet. */
export interface AllocationResult {
  ok: boolean;
  /** The user said no. Reported, but not as a fault — it gets no red. */
  cancelled?: boolean;
  error?: string;
}

interface Props {
  mode: "buy" | "sell";
  rows: AllocationRow[];
  /** Buy only: the money available to split across the rows. */
  budgetUsd?: number;
  busy: boolean;
  /** "2 of 3" while it runs — each asset is its own transaction. */
  progress?: string | null;
  /** Per-row outcome, keyed by row id — see the note on the results line below. */
  results?: Record<string, AllocationResult>;
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
 *
 * Each row also reports its OWN result. The run continues past a failure, but the
 * outcomes were only printed on the bar underneath — which this sheet covers, and
 * the sheet stays open precisely when something failed. So one bad asset looked like
 * the end of the run, and the assets after it were invisible.
 */
export function AllocationSheet({
  mode,
  rows,
  budgetUsd,
  busy,
  progress,
  results,
  error,
  onConfirm,
  onClose,
}: Props) {
  const { t } = useT();
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  // A row that already went through is finished business: its amount is still typed
  // in, and after a partial run the sheet stays open, so counting it again would let
  // a second confirm buy or sell the very same thing twice.
  const settled = (id: string) => results?.[id]?.ok === true;
  const valueOf = (id: string) =>
    settled(id) ? 0 : Math.max(0, parseFloat(amounts[id] ?? "") || 0);
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
          {rows.map((r) => {
            const result = results?.[r.id];
            const broke = result && !result.ok && !result.cancelled;
            return (
            <div
              key={r.id}
              className={`rounded-[10px] border p-3 ${
                broke ? "border-red-600/30 bg-red-600/[0.03]" : "border-black/10"
              }`}
            >
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
                {result?.ok && <Check size={14} strokeWidth={2} className="shrink-0 text-black/45" />}
                <div className="flex items-baseline gap-1">
                  <span className="text-black/35">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amounts[r.id] ?? ""}
                    onChange={(e) => setAmount(r.id, e.target.value)}
                    placeholder="0"
                    disabled={busy || !!result?.ok}
                    className="w-24 border-b border-black/15 bg-transparent py-0.5 text-right text-[17px] tabular-nums text-black outline-none focus:border-black/40"
                  />
                </div>
              </div>
              {result?.ok ? null : result ? (
                <p className={`mt-2 text-[11px] leading-snug ${broke ? "text-red-600" : "text-black/45"}`}>
                  {result.cancelled ? t("bulk.stopped") : result.error}
                </p>
              ) : (
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
              )}
            </div>
            );
          })}
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
