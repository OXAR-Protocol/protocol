"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { SheetShell } from "@/components/sheet-shell";
import { AssetActionRail } from "@/components/asset-action-rail";
import { useT } from "@/lib/i18n";

/**
 * Two buttons, always on screen, and the whole transaction behind them.
 *
 * On a phone the buy panel sat inline, below a chart and a description, so the
 * one thing a person came to do was the one thing they had to scroll for — and
 * once they found it, the form was already open, asking what to pay with before
 * they had said they wanted to buy.
 *
 * Now the page reads as a page, and the acts wait at the bottom. Tapping one
 * raises the sheet with what it needs and nothing else; the sheet knows which act
 * it is, so the same panel serves both without a tab strip explaining itself.
 *
 * Desktop keeps the rail beside the chart — there is room there, and a bar pinned
 * to the bottom of a wide window is a phone habit in the wrong place.
 */
export function AssetActionBar({
  view,
  price,
  positionValue,
  amount,
  onAmountChange,
  onDeposited,
  onSell,
  loading,
  error,
  sharePriceUsd,
  unitLabel,
}: {
  view: ProviderView;
  price: boolean;
  positionValue: number;
  amount: number;
  onAmountChange: (v: number) => void;
  onDeposited: (usd: number, pending?: boolean) => void;
  onSell: () => void;
  loading: boolean;
  error: string | null;
  sharePriceUsd?: number;
  unitLabel?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState<null | "buy" | "sell">(null);
  const canSell = positionValue > 0;

  return (
    <>
      {/* Along the bottom edge, where the navigation used to be: on this page the tab
          bar steps aside (see `TabBar`), so the two acts have the place a thumb
          already reaches for, instead of hovering above a bar competing with them. */}
      <div className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 lg:hidden">
        <div className="pointer-events-auto mx-auto mb-3 flex max-w-[520px] gap-2 rounded-full border border-ink/10 bg-paper/90 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => setOpen("buy")}
            className="flex-1 rounded-full bg-ink py-3 text-[14px] lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
          >
            {price ? t("rail.buy") : t("rail.deposit")}
          </button>
          <button
            type="button"
            onClick={() => canSell && setOpen("sell")}
            disabled={!canSell}
            title={canSell ? undefined : t("rail.nothingToSell")}
            className="flex-1 rounded-full border border-ink/15 py-3 text-[14px] lowercase tracking-wide text-ink/70 transition hover:border-ink/40 hover:text-ink disabled:opacity-35"
          >
            {price ? t("rail.sell") : t("rail.withdraw")}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <SheetShell
            label={view.name}
            title={
              open === "buy"
                ? price
                  ? t("rail.verbBuy")
                  : t("rail.verbDeposit")
                : price
                  ? t("rail.sell")
                  : t("rail.withdraw")
            }
            onClose={() => setOpen(null)}
          >
            <AssetActionRail
              view={view}
              price={price}
              positionValue={positionValue}
              amount={amount}
              onAmountChange={onAmountChange}
              onDeposited={(usd, pending) => {
                setOpen(null);
                onDeposited(usd, pending);
              }}
              onSell={onSell}
              loading={loading}
              error={error}
              sharePriceUsd={sharePriceUsd}
              unitLabel={unitLabel}
              initialTab={open}
              bare
            />
          </SheetShell>
        )}
      </AnimatePresence>
    </>
  );
}
