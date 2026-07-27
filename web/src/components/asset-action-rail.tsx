"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CreditCard } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { DepositPanel } from "@/components/deposit-panel";
import { YieldAmountField } from "@/components/yield-amount-field";
import { CashOutSheet } from "@/components/cash-out-sheet";
import { useSwapOutPreview, NOTABLE_SELL_COST } from "@/hooks/use-swap-out-preview";
import { useFeature } from "@/hooks/use-features";
import { SellAmountControls } from "@/components/sell-amount-controls";
import { floorToCents, formatUsdAmount } from "@oxar/sdk";
import { useT, localizeError } from "@/lib/i18n";

interface Props {
  view: ProviderView;
  /** Price-exposure asset (stock/gold) → "buy/sell"; else yield → "deposit/withdraw". */
  price: boolean;
  /** Current position value, in USD for price assets / underlying for yield. */
  positionValue: number;
  /** Sell/withdraw amount (controlled) + its setter. */
  amount: number;
  onAmountChange: (v: number) => void;
  /** Buy success — surface the deposited amount upstream (`pending` = still bridging). */
  onDeposited: (usd: number, pending?: boolean) => void;
  /** Run the sell/withdraw (planWithdrawal + redeem/withdraw lives upstream). */
  onSell: () => void;
  loading: boolean;
  error: string | null;
  /** Per-unit USD price → enables the "buy N units" quantity input on buy. */
  sharePriceUsd?: number;
  /** Label for one unit, e.g. "SPCXx". */
  unitLabel?: string;
}

/** Sticky Buy / Sell rail beside the chart (Ondo-style). Buy = DepositPanel;
 *  Sell = withdraw/redeem field, disabled until there's a position to exit. */
export function AssetActionRail({
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
}: Props) {
  const { t } = useT();
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [showCashOut, setShowCashOut] = useState(false);
  const [sellInUnits, setSellInUnits] = useState(false);
  const canSell = positionValue > 0;
  // Fractions, a one-press full exit, and a units view — dark until the key is on.
  const sellingV2 = useFeature("selling-v2");
  // Units are only meaningful where a unit has a price (stocks, gold), and only
  // while the flag is on; everything else stays denominated in dollars.
  const unitsMode = sellingV2 && sellInUnits && !!sharePriceUsd && sharePriceUsd > 0;

  // What the sell will actually pay out. We no longer refuse expensive sells (that
  // locked holders of thin tickers in) — we state the cost and let the user decide.
  const sellOut = useSwapOutPreview({
    heldMint: view.heldMint,
    shares: view.shares,
    positionValue,
    usdAmount: amount,
    enabled: tab === "sell" && canSell && !!view.heldMint,
  });
  const sellCostNotable =
    sellOut.costFraction !== null && sellOut.costFraction >= NOTABLE_SELL_COST;
  const tabClass = (active: boolean) =>
    `rounded-full py-2 text-[13px] lowercase tracking-wide transition ${
      active ? "bg-white text-black shadow-sm" : "text-black/45 hover:text-black/70"
    }`;

  return (
    <div className="lg:sticky lg:top-24">
      {/* Buy / Sell toggle */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-black/[0.05] p-1">
        <button type="button" onClick={() => setTab("buy")} className={tabClass(tab === "buy")}>
          {price ? t("rail.buy") : t("rail.deposit")}
        </button>
        <button
          type="button"
          onClick={() => canSell && setTab("sell")}
          disabled={!canSell}
          title={canSell ? undefined : t("rail.nothingToSell")}
          className={`${tabClass(tab === "sell" && canSell)} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {price ? t("rail.sell") : t("rail.withdraw")}
        </button>
      </div>

      {tab === "buy" || !canSell ? (
        <DepositPanel
          view={view}
          verb={price ? t("rail.verbBuy") : t("rail.verbDeposit")}
          onDeposited={onDeposited}
          sharePriceUsd={sharePriceUsd}
          unitLabel={unitLabel}
        />
      ) : (
        <>
          <YieldAmountField
            label={
              unitsMode
                ? t("rail.sellUnitsLabel", { sym: unitLabel ?? "units" })
                : t(price ? "rail.sellLabel" : "rail.withdrawLabel", { sym: view.assetSymbol })
            }
            symbol={unitsMode ? (unitLabel ?? "units") : price ? "USDC" : view.assetSymbol}
            value={unitsMode ? amount / sharePriceUsd! : amount}
            onChange={(v) => onAmountChange(unitsMode ? v * sharePriceUsd! : v)}
            hint={
              <span className="flex items-center gap-2">
                {price ? t("rail.worth") : t("rail.available")}: ${formatUsdAmount(positionValue)}
                <button
                  type="button"
                  onClick={() => onAmountChange(floorToCents(positionValue))}
                  className="lowercase tracking-wide text-[#3c05c7]/80 transition hover:text-[#3c05c7]"
                >
                  {t("rail.max")}
                </button>
              </span>
            }
            actionLabel={price ? t("rail.actionSell") : t("rail.actionWithdraw")}
            onAction={onSell}
            loading={loading}
            disabled={loading || amount <= 0 || amount > positionValue}
            variant="primary"
            controls={
              sellingV2 ? (
                <SellAmountControls
                  positionValue={positionValue}
                  amount={amount}
                  onAmountChange={onAmountChange}
                  unitPriceUsd={sharePriceUsd}
                  unitLabel={unitLabel}
                  inUnits={sellInUnits}
                  onToggleUnits={() => setSellInUnits((v) => !v)}
                  disabled={loading}
                />
              ) : null
            }
          />

          {/* What you'll actually receive — a real quote, shown instead of blocking the
              sell (which used to leave holders with no way out). The gap against the
              amount asked for is NOT a fee the sell charges: on a thin token the pool
              simply sits off the reference price the position is valued at, often
              because the spread was paid on the way IN. So the wording states the
              difference rather than blaming the exit. */}
          {sellOut.proceedsUsd !== null && (
            <p
              className={`mt-2 text-center text-[12px] tabular-nums ${
                sellCostNotable ? "text-[#a35b00]" : "text-black/45"
              }`}
            >
              {t("rail.youReceive")}: ${formatUsdAmount(sellOut.proceedsUsd)}
              {sellCostNotable && (
                <>
                  {" · "}
                  {t("rail.belowMarketShort", {
                    pct: ((sellOut.costFraction ?? 0) * 100).toFixed(1),
                  })}
                </>
              )}
            </p>
          )}

          {/* Cash all the way out — sell to USDC here, then off-ramp to a card.
              Secondary button beside the primary "sell" — same shape, lighter weight. */}
          <button
            type="button"
            onClick={() => setShowCashOut(true)}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-3 text-[14px] lowercase tracking-wide text-black/70 transition hover:border-black/40 hover:text-black"
          >
            <CreditCard size={14} strokeWidth={1.5} />
            {t("rail.cashOut")}
            <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[9px] lowercase tracking-wide text-black/45">
              {t("common.soon")}
            </span>
          </button>
        </>
      )}

      {error && <p className="mt-3 text-center text-xs text-red-600">{localizeError(error, t)}</p>}

      <AnimatePresence>
        {showCashOut && <CashOutSheet onClose={() => setShowCashOut(false)} />}
      </AnimatePresence>
    </div>
  );
}
