"use client";

import { Check, Loader2 } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import type { BulkTradeOutcome, BulkTradeState } from "@/hooks/use-bulk-trade";
import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useT } from "@/lib/i18n";

interface Props {
  /** The picked positions, for the stacked icons — a set you can see. */
  picked: { id: string; symbol: string }[];
  selectedCount: number;
  totalUsd: number;
  state: BulkTradeState;
  done: readonly BulkTradeOutcome[];
  /** Drives the button's word — the rest of the bar is identical either way. */
  mode: "buy" | "sell";
  onSell: () => void;
  onClear: () => void;
}

/**
 * The bar that appears once things are picked — the same bar for buying and for
 * selling, because it is the same gesture pointed in two directions. It reports progress per
 * position rather than a spinner, because each one is its own transaction and its
 * own wallet prompt — "3 of 5" is the truth, "selling…" isn't.
 */
export function PickBar({ picked, selectedCount, totalUsd, state, done, mode, onSell, onClear }: Props) {
  const { t } = useT();

  const failed = done.filter((d) => !d.ok);
  // The bar exists to hold a selection or to report on one. After a run where
  // everything went through, it has neither — the set is cleared and there is
  // nothing left to say, so it should leave rather than sit there reading
  // "0 in multi".
  if (selectedCount === 0 && failed.length === 0) return null;
  // Stopping is not failing: it gets a plain line, not a red one.
  const cancelled = failed.some((f) => f.cancelled);
  const realFailures = failed.filter((f) => !f.cancelled);
  const selling = state === "running";

  return (
    // Above the tab bar, INCLUDING the home indicator it sits on. The tab bar is
    // 4rem of content plus `env(safe-area-inset-bottom)`, so a fixed 6rem cleared it
    // on a laptop and landed exactly on it on a phone — which is where this lives.
    // Written as one expression so both get the same 2rem of air.
    <div className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-fit max-w-[calc(100vw-1.5rem)] -translate-x-1/2">
    {/* One row, always. It used to wrap on a phone, which turns a pill into a blob
        and stacked the icons on top of each other. Nothing here may grow the bar:
        the label truncates, the icons stand down on narrow screens. */}
    <div className="flex flex-nowrap items-center gap-2 rounded-full border border-ink/10 bg-paper/95 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.10)] backdrop-blur sm:gap-3">
      {/* The set, shown as itself: overlapping marks rather than a count alone. */}
      {picked.length > 0 && (
        <span className="hidden shrink-0 items-center pl-1 sm:flex">
          {picked.slice(0, 4).map((p, i) => (
            // Inline spans align on the TEXT BASELINE, so a picture icon and a
            // letter-fallback icon sat at different heights. A fixed box each,
            // centred, makes them line up whatever they contain.
            <span
              key={p.id}
              className={`flex h-[22px] w-[22px] items-center justify-center ${i === 0 ? "" : "-ml-2"}`}
            >
              <AssetIcon src={assetLogoSrc(p.id)} label={assetIconLabel(p.id, p.symbol)} size={22} />
            </span>
          ))}
        </span>
      )}
      <span className="min-w-0 flex-1 truncate text-[13px] tabular-nums text-ink/70">
        {selling
          ? t(mode === "sell" ? "bulk.progressSell" : "bulk.progressBuy", { n: String(done.length), total: String(selectedCount) })
          : mode === "sell"
            ? // Selling: the figure is what the picked positions are worth — a fact
              // about the selection.
              t("bulk.setLabel", { n: String(selectedCount), usd: `$${formatUsdAmount(totalUsd)}` })
            : // Buying: the figure was the BUDGET, which read as "the things you picked
              // are worth $0.00". Two different quantities were sharing one slot; the
              // budget belongs in the sheet, where it's labelled.
              t("bulk.setLabelBuy", { n: String(selectedCount) })}
      </span>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={selling}
          className="text-[12px] lowercase tracking-wide text-ink/45 transition hover:text-ink disabled:opacity-40"
        >
          {t("bulk.clear")}
        </button>
        <button
          type="button"
          onClick={onSell}
          disabled={selling || selectedCount === 0}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] lowercase tracking-wide text-paper transition hover:bg-ink/85 disabled:opacity-40"
        >
          {selling && <Loader2 size={13} className="animate-spin" />}
          {t(mode === "sell" ? "bulk.sellSelected" : "bulk.buySelected")}
        </button>
      </div>
    </div>

    {/* Outside the pill: a message inside a rounded-full container stretched it into
        a blob. Naming what didn't go through, and why — "some failed" can't be acted on. */}
    {state === "done" && (cancelled || realFailures.length > 0) && (
      <p className={`mt-2 px-4 text-center text-[12px] ${realFailures.length ? "text-loss" : "text-ink/50"}`}>
        {realFailures.length > 0
          ? realFailures.map((f) => `${f.id}${f.error ? ` — ${f.error}` : ""}`).join(" · ")
          : t("bulk.stopped")}
      </p>
    )}
    </div>
  );
}
