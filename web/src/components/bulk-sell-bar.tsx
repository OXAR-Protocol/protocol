"use client";

import { Loader2 } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import type { BulkSellOutcome, BulkSellState } from "@/hooks/use-bulk-sell";
import { useT } from "@/lib/i18n";

interface Props {
  selectedCount: number;
  totalUsd: number;
  state: BulkSellState;
  done: readonly BulkSellOutcome[];
  onSell: () => void;
  onClear: () => void;
}

/**
 * The bar that appears once positions are ticked. It reports progress per
 * position rather than a spinner, because each one is its own transaction and its
 * own wallet prompt — "3 of 5" is the truth, "selling…" isn't.
 */
export function BulkSellBar({ selectedCount, totalUsd, state, done, onSell, onClear }: Props) {
  const { t } = useT();
  if (selectedCount === 0 && state === "idle") return null;

  const failed = done.filter((d) => !d.ok);
  const selling = state === "selling";

  return (
    <div className="sticky bottom-20 z-30 mx-auto mt-6 flex max-w-[560px] flex-wrap items-center gap-3 rounded-full border border-black/10 bg-white/95 px-5 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.10)] backdrop-blur">
      <span className="text-[13px] tabular-nums text-black/70">
        {selling
          ? t("bulk.progress", { n: String(done.length), total: String(selectedCount) })
          : t("bulk.selected", { n: String(selectedCount), usd: `$${formatUsdAmount(totalUsd)}` })}
      </span>

      {/* Naming the ones that didn't go through, AND why — "some failed" can't be
          acted on, and neither can a list of names with no reason. */}
      {state === "done" && failed.length > 0 && (
        <span className="w-full text-[12px] text-red-600">
          {failed.map((f) => `${f.id}${f.error ? ` — ${f.error}` : ""}`).join(" · ")}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={selling}
          className="text-[12px] lowercase tracking-wide text-black/45 transition hover:text-black disabled:opacity-40"
        >
          {t("bulk.clear")}
        </button>
        <button
          type="button"
          onClick={onSell}
          disabled={selling || selectedCount === 0}
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-[13px] lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-40"
        >
          {selling && <Loader2 size={13} className="animate-spin" />}
          {t("bulk.sellSelected")}
        </button>
      </div>
    </div>
  );
}
