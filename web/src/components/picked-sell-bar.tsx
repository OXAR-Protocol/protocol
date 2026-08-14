"use client";

import { useState } from "react";

import { fromBaseUnits, positionTitle, unitLabelOf } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { PickBar } from "@/components/pick-bar";
import { AllocationSheet } from "@/components/allocation-sheet";
import { useBulkTrade } from "@/hooks/use-bulk-trade";
import { useT } from "@/lib/i18n";

interface Props {
  /** The positions currently picked — what the bar reports and the sheet splits. */
  views: ProviderView[];
  /** Every held position, for naming a failed row by its asset rather than its id. */
  allHeld: ProviderView[];
  /** Which ids should stay ticked after a run — the ones still needing a decision. */
  onOutcome: (stillSelected: ReadonlySet<string>) => void;
  /** Positions changed on-chain; refresh them. */
  onDone: () => void;
}

/**
 * Selling several positions in one gesture — the mirror of `PickedBuyBar`, and the
 * same bar and sheet underneath, because it is one gesture pointed two ways.
 *
 * It lives apart from the portfolio list so the list stays a list: the run's state
 * (which one is signing, which failed) belongs to the run, not to the rows.
 */
export function PickedSellBar({ views, allHeld, onOutcome, onDone }: Props) {
  const { t } = useT();
  const bulk = useBulkTrade();
  // "Sell" asks HOW MUCH of each, rather than assuming everything.
  const [allocating, setAllocating] = useState(false);

  const totalUsd = views.reduce((sum, v) => sum + fromBaseUnits(v.underlyingBalance, v.decimals), 0);

  const sellSelected = async (amounts: Record<string, number>) => {
    // Read the RETURNED outcomes, not `bulk.done` — that's state captured at render
    // and still holds the previous run's value at this point.
    const outcomes = await bulk.run(
      views
        .filter((v) => (amounts[v.id] ?? 0) > 0)
        .map((v) => ({
          kind: "sell" as const,
          id: v.id,
          shares: v.shares,
          valueUsd: fromBaseUnits(v.underlyingBalance, v.decimals),
          amountUsd: amounts[v.id],
        })),
    );
    // Keep the failed ones ticked: they are what the user still has to deal with.
    onOutcome(new Set(outcomes.filter((o) => !o.ok).map((o) => o.id)));
    if (outcomes.every((o) => o.ok)) {
      setAllocating(false);
      // See PickedBuyBar: a finished run must not colour the next selection.
      bulk.reset();
    }
    onDone();
  };

  return (
    <>
      <PickBar
        mode="sell"
        picked={views.map((v) => ({ id: v.id, symbol: v.assetSymbol }))}
        selectedCount={views.length}
        totalUsd={totalUsd}
        state={bulk.state}
        done={bulk.done.map((d) => ({
          ...d,
          id: allHeld.find((v) => v.id === d.id)?.name ?? d.id,
        }))}
        onSell={() => setAllocating(true)}
        onClear={() => {
          onOutcome(new Set());
          bulk.reset();
        }}
      />

      {allocating && (
        <AllocationSheet
          mode="sell"
          rows={views.map((v) => {
            const usd = fromBaseUnits(v.underlyingBalance, v.decimals);
            // What one unit is worth, read off the position itself — no price call:
            // we already know what it's worth and how many of it there are. Only for
            // things counted in shares or grams; a lending market is dollars.
            const units =
              isPriceExposure(v.id) && v.heldDecimals !== undefined
                ? Number(v.shares) / 10 ** v.heldDecimals
                : 0;
            return {
              id: v.id,
              name: positionTitle(v),
              symbol: v.assetSymbol,
              maxUsd: usd,
              ...(units > 0 ? { unitPriceUsd: usd / units, unitLabel: unitLabelOf(v) } : {}),
            };
          })}
          busy={bulk.state === "running"}
          results={bulk.results}
          progress={
            bulk.state === "running"
              ? t("bulk.progressSell", { n: String(bulk.done.length), total: String(views.length) })
              : null
          }
          onConfirm={sellSelected}
          onClose={() => {
            setAllocating(false);
            bulk.reset();
          }}
        />
      )}
    </>
  );
}
