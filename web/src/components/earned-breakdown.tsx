"use client";

import { formatSignedUsd, type RangePerformance } from "@oxar/sdk";

import { AssetIcon } from "@/components/asset-icon";
import { assetIconLabel, assetLogoSrc } from "@/lib/yield/asset-logo";
import { byHolding } from "@/lib/yield/earned-rows";
import { useT } from "@/lib/i18n";

/**
 * Where a period's earnings actually came from.
 *
 * A single net figure that can go negative is unanswerable on its own: one holding
 * that fell and one trade that cost look exactly alike from the outside, and the
 * reader is left assuming the worse of the two. This says which — first by cause
 * (the market, or what changing holdings cost to execute), then by holding.
 *
 * Collapsed by default, because the answer is only wanted when the question comes up.
 */
export function EarnedBreakdown({
  performance,
  heldMints,
}: {
  performance: RangePerformance;
  heldMints: string[];
}) {
  const { t } = useT();
  const rows = byHolding(performance.perMint, new Set(heldMints), {
    cash: t("history.cash"),
    other: t("history.other"),
  });

  return (
    <div className="mt-3 rounded-field bg-ink/[0.02] px-3 py-2.5">
      <Line label={t("history.market")} amount={performance.marketUsd} />
      <Line label={t("history.tradingCost")} amount={performance.costUsd} />

      {rows.length > 0 && (
        <div className="mt-2 space-y-0 border-t border-ink/[0.06] pt-2">
          {rows.map((r) => (
            <Line
              key={r.label}
              label={r.label}
              amount={r.amount}
              sourceId={r.sourceId}
              note={r.held ? undefined : t("history.closed")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Line({
  label,
  amount,
  sourceId,
  note,
}: {
  label: string;
  amount: number;
  /** Present for a real holding — it then wears the same mark as its row in the
   *  positions list, which is what makes a list of names scannable. */
  sourceId?: string | null;
  /** "closed", when the range covers a holding the wallet no longer has. */
  note?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <span className="flex min-w-0 items-center gap-1.5">
        {sourceId && (
          <AssetIcon
            src={assetLogoSrc(sourceId)}
            label={assetIconLabel(sourceId, label)}
            size={14}
            className="shrink-0"
          />
        )}
        <span className="truncate text-[11px] lowercase text-ink/45">{label}</span>
        {note && <span className="shrink-0 text-[10px] lowercase text-ink/25">· {note}</span>}
      </span>
      <span
        className={`shrink-0 text-[11px] tabular-nums ${amount < 0 ? "text-loss" : "text-ink/70"}`}
      >
        {formatSignedUsd(amount)}
      </span>
    </div>
  );
}
