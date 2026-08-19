"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeftRight, Check, X } from "lucide-react";

import { formatUsdAmount, floorTo, floorToCents, normalizeDecimalInput } from "@oxar/sdk";

import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { SwipeToConfirm } from "@/components/swipe-to-confirm";
import { useT } from "@/lib/i18n";

export interface AllocationRow {
  id: string;
  name: string;
  symbol: string;
  /** Sell: what this position is worth. Buy: unused — the budget is shared. */
  maxUsd?: number;
  /** What one unit costs, and what to call it. Present only where "how many" is a
   *  question a person actually asks — a share, a gram of gold. You put DOLLARS into
   *  a lending market; nobody wants to think in receipt tokens. */
  unitPriceUsd?: number;
  unitLabel?: string;
  /** The other markets of the same source — Jupiter Lend's USDC beside its USDT.
   *  A collapsed card had to choose one for you to get here; this is where you say
   *  otherwise, instead of backing out and starting the basket again. */
  alternatives?: { id: string; label: string; apy: number }[];
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
  /** Buy only: what the budget is paid with. Rendered above the rows, ONCE, because
   *  the conversion happens once for the whole basket — see `useBulkFunding`. */
  payWith?: ReactNode;
  error?: string | null;
  onConfirm: (amounts: Record<string, number>) => void;
  /** Swap one row for a sibling market, carrying its amount across. */
  onSwap?: (fromId: string, toId: string) => void;
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
  payWith,
  error,
  onConfirm,
  onSwap,
  onClose,
}: Props) {
  const { t } = useT();
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  // Which rows are being typed in units rather than dollars. Per row, because a
  // basket can hold a share and a lending market at once, and only one of those has
  // units worth naming.
  const [inUnits, setInUnits] = useState<Record<string, boolean>>({});

  const unitMode = (r: AllocationRow) => !!inUnits[r.id] && !!r.unitPriceUsd;
  /** What the row is worth in dollars, whatever it is being typed in. */
  const usdOf = (r: AllocationRow, typed: number) =>
    unitMode(r) ? typed * (r.unitPriceUsd ?? 0) : typed;

  // A row that already went through is finished business: its amount is still typed
  // in, and after a partial run the sheet stays open, so counting it again would let
  // a second confirm buy or sell the very same thing twice.
  const settled = (id: string) => results?.[id]?.ok === true;
  const typedIn = (id: string) => Math.max(0, parseFloat(amounts[id] ?? "") || 0);
  const valueOf = (r: AllocationRow) => (settled(r.id) ? 0 : usdOf(r, typedIn(r.id)));
  const allocated = rows.reduce((sum, r) => sum + valueOf(r), 0);
  const remaining = budgetUsd !== undefined ? budgetUsd - allocated : 0;
  const overBudget = budgetUsd !== undefined && remaining < -0.005;
  const nothing = allocated <= 0;

  const setAmount = (id: string, v: string) =>
    setAmounts((prev) => ({ ...prev, [id]: normalizeDecimalInput(v) }));

  // The row keeps whatever was typed into it; only the market underneath changes.
  const swapRow = (from: string, to: string) => {
    setAmounts((prev) => {
      const { [from]: carried, ...rest } = prev;
      return carried === undefined ? rest : { ...rest, [to]: carried };
    });
    onSwap?.(from, to);
  };

  /**
   * Sell: a fraction of THIS position — the rows are independent, so the position is
   * the only base that means anything.
   *
   * Buy: a fraction of the WHOLE budget, not of what's left of it. Measuring against
   * the remainder made 25% a different amount on every row — a quarter, then a
   * quarter of the surviving three quarters — so four taps of "25%" spent an odd
   * fraction and the numbers read as accidents rather than choices. A percentage has
   * to mean one thing.
   *
   * The cost is that the buttons can now overshoot the budget. That's a trade worth
   * making because overshooting is already a visible, fixable state: the header turns
   * red, says what's over, and the confirm button won't fire.
   */
  const applyFraction = (row: AllocationRow, f: number) => {
    // The base is always DOLLARS — a share of a position or of the budget. Typing in
    // units changes how the answer is written down, never what it is a share of, so
    // "50%" can't ask for more than the same 50% would in dollars.
    const base = mode === "sell" ? row.maxUsd ?? 0 : budgetUsd ?? 0;
    const usd = base * f;
    setAmount(
      row.id,
      unitMode(row) ? String(floorTo(usd / (row.unitPriceUsd || 1), 6)) : String(floorToCents(usd)),
    );
  };

  // Switching units keeps the money, not the number: $12 stays $12 and is re-written
  // as 0.0031 of the thing. Re-typing it after every switch would be the whole
  // feature, undone.
  // Half a basket is a state worth naming. Signing two of five and closing used to
  // discard the other three silently — the wallet had already moved money, and the
  // screen that knew which rows were left just went away. One press asks; a second
  // one leaves.
  const partlyDone =
    !!results &&
    rows.some((r) => results[r.id]?.ok) &&
    rows.some((r) => !results[r.id]?.ok);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const requestClose = () => {
    if (partlyDone && !confirmLeave) {
      setConfirmLeave(true);
      return;
    }
    onClose();
  };

  const toggleUnits = (r: AllocationRow) => {
    const typed = typedIn(r.id);
    const price = r.unitPriceUsd || 0;
    const next = !unitMode(r);
    setInUnits((prev) => ({ ...prev, [r.id]: next }));
    if (typed <= 0 || price <= 0) return;
    setAmount(r.id, next ? String(floorTo(typed / price, 6)) : String(floorToCents(typed * price)));
  };

  // z-[60], above the tab bar: that is also fixed at z-50 and, being later in the
  // document, painted straight over the confirm button. Scrolling couldn't rescue it
  // — the button wasn't past the sheet's edge, it was under the nav.
  return (
    <div
      data-no-pull
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/25 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-h-[88vh] w-full max-w-[520px] overflow-auto rounded-t-[16px] border border-ink/10 bg-paper p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[16px]"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] text-ink">
              {t(mode === "sell" ? "alloc.sellTitle" : "alloc.buyTitle")}
            </p>
            {budgetUsd !== undefined && (
              <p className={`mt-0.5 text-[12px] tabular-nums ${overBudget ? "text-loss" : "text-ink/45"}`}>
                {t("alloc.left", { usd: `$${formatUsdAmount(Math.abs(remaining))}` })}
                {overBudget ? ` — ${t("alloc.over")}` : ""}
              </p>
            )}
          </div>
          <button type="button" onClick={requestClose} disabled={busy} className="text-ink/35 transition hover:text-ink disabled:opacity-40">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {payWith && <div className="mb-3">{payWith}</div>}

        <div className="space-y-2">
          {rows.map((r) => {
            const result = results?.[r.id];
            const broke = result && !result.ok && !result.cancelled;
            return (
            <div
              key={r.id}
              className={`rounded-[10px] border p-3 ${
                broke ? "border-red-600/30 bg-red-600/[0.03]" : "border-ink/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <AssetIcon src={assetLogoSrc(r.id)} label={assetIconLabel(r.id, r.symbol)} size={28} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-ink">{r.name}</p>
                  {!busy && !result && (r.alternatives?.length ?? 0) > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {r.alternatives!.map((alt) => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => swapRow(r.id, alt.id)}
                          aria-label={t("alloc.switchTo", { name: alt.label })}
                          title={t("alloc.switchTo", { name: alt.label })}
                          className="inline-flex items-center gap-1 rounded-full border border-ink/15 px-2 py-0.5 text-[10px] lowercase tracking-wide text-ink/50 transition hover:border-ink/40 hover:text-ink"
                        >
                          {/* Without a mark of its own this read as a label rather than
                              a control — reported as "not obvious you can change it". */}
                          <ArrowLeftRight size={9} strokeWidth={2} className="shrink-0" />
                          {alt.label} {(alt.apy * 100).toFixed(2)}%
                        </button>
                      ))}
                    </div>
                  )}
                  {mode === "sell" && r.maxUsd !== undefined && (
                    <p className="text-[11px] tabular-nums text-ink/40">
                      {t("alloc.youHave", { usd: `$${formatUsdAmount(r.maxUsd)}` })}
                    </p>
                  )}
                </div>
                {result?.ok && <Check size={14} strokeWidth={2} className="shrink-0 text-ink/45" />}
                <div className="flex flex-col items-end">
                <div className="flex items-baseline gap-1">
                  {r.unitPriceUsd ? (
                    <button
                      type="button"
                      onClick={() => toggleUnits(r)}
                      disabled={busy || !!result?.ok}
                      aria-label={t("alloc.switchUnits")}
                      title={t("alloc.switchUnits")}
                      className="rounded px-1 text-[11px] lowercase tracking-wide text-ink/40 underline decoration-dotted underline-offset-2 transition hover:text-ink disabled:no-underline"
                    >
                      {unitMode(r) ? r.unitLabel : "$"}
                    </button>
                  ) : (
                    <span className="text-ink/35">$</span>
                  )}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={amounts[r.id] ?? ""}
                    onChange={(e) => setAmount(r.id, e.target.value)}
                    placeholder="0"
                    disabled={busy || !!result?.ok}
                    className="w-24 border-b border-ink/15 bg-transparent py-0.5 text-right text-[17px] tabular-nums text-ink outline-none focus:border-ink/40"
                  />
                </div>
                {/* Both readings, always — the one being typed and what it comes to. */}
                {r.unitPriceUsd && typedIn(r.id) > 0 && (
                  <span className="mt-0.5 text-[10px] tabular-nums text-ink/35">
                    {unitMode(r)
                      ? `$${formatUsdAmount(valueOf(r))}`
                      : `${floorTo(typedIn(r.id) / r.unitPriceUsd, 6)} ${r.unitLabel ?? ""}`}
                  </span>
                )}
                </div>
              </div>
              {result?.ok ? null : result ? (
                <p className={`mt-2 text-[11px] leading-snug ${broke ? "text-loss" : "text-ink/45"}`}>
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
                      className="rounded-full bg-ink/[0.05] px-2.5 py-1 text-[11px] lowercase tracking-wide text-ink/55 transition hover:text-ink disabled:opacity-40"
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

        {error && <p className="mt-3 text-center text-[12px] text-loss">{error}</p>}

        {/* Asked where it can be answered: the rows above still show which went
            through and which didn't, so the question isn't abstract. */}
        {confirmLeave && (
          <div className="mt-3 rounded-[10px] border border-ink/15 bg-ink/[0.03] p-3 text-center">
            <p className="text-[12px] text-ink/70">
              {t("alloc.leavePartial", {
                done: String(rows.filter((r) => results?.[r.id]?.ok).length),
                total: String(rows.length),
              })}
            </p>
            <div className="mt-2 flex justify-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="rounded-full border border-ink/15 px-3 py-1.5 text-[12px] lowercase tracking-wide text-ink/60 transition hover:border-ink/40 hover:text-ink"
              >
                {t("alloc.stay")}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-ink bg-ink px-3 py-1.5 text-[12px] lowercase tracking-wide text-paper transition hover:opacity-90"
              >
                {t("alloc.leave")}
              </button>
            </div>
          </div>
        )}

        {/* Sticky: with several assets the list is taller than the sheet, and a
            confirm you have to go looking for is a confirm people don't find. */}
        <div className="sticky bottom-0 -mx-5 mt-4 bg-gradient-to-t from-paper via-paper to-paper/0 px-5 pb-1 pt-3">
        {/* Held, not tapped — several assets bought or sold in one gesture is the
            biggest single act in the app, and it sits under a thumb that has just
            been scrolling a list. */}
        <SwipeToConfirm
          label={t(mode === "sell" ? "alloc.confirmSell" : "alloc.confirmBuy", {
            usd: `$${formatUsdAmount(allocated)}`,
          })}
          busyLabel={progress ?? undefined}
          busy={busy}
          disabled={nothing || overBudget}
          onConfirm={() =>
            onConfirm(Object.fromEntries(rows.map((r) => [r.id, valueOf(r)]).filter(([, v]) => (v as number) > 0)))
          }
        />

        {/* Several assets means several transactions — said once, before signing. */}
        <p className="mt-2 text-center text-[11px] text-ink/35">
          {t("alloc.note", { n: String(rows.length) })}
        </p>
        </div>
      </motion.div>
    </div>
  );
}
