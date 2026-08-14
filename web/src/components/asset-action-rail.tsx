"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CreditCard } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { DepositPanel } from "@/components/deposit-panel";
import { GuestActionRail } from "@/components/guest-action-rail";
import { YieldAmountField } from "@/components/yield-amount-field";
import { CashOutSheet, CASH_OUT_FEATURE } from "@/components/cash-out-sheet";
import { useSwapOutPreview } from "@/hooks/use-swap-out-preview";
import { useFeature } from "@/hooks/use-features";
import { SellAmountControls } from "@/components/sell-amount-controls";
import { SellDetails } from "@/components/sell-details";
import { formatUsdAmount } from "@oxar/sdk";
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
  /** Which act the caller already committed to — the phone's bar asks first. */
  initialTab?: "buy" | "sell";
  /** Inside a sheet: no sticky positioning, and no tab strip, because the sheet's
   *  own title already says which act this is. */
  bare?: boolean;
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
  initialTab,
  bare,
}: Props) {
  const { t } = useT();
  const { authenticated, ready } = usePrivy();
  const [tab, setTab] = useState<"buy" | "sell">(initialTab ?? "buy");
  const [showCashOut, setShowCashOut] = useState(false);
  const [sellInUnits, setSellInUnits] = useState(false);
  const canSell = positionValue > 0;
  // Fractions, a one-press full exit, and a units view — dark until the key is on.
  const sellingV2 = useFeature("selling-v2");
  const cashOutLive = useFeature(CASH_OUT_FEATURE);
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
  const tabClass = (active: boolean) =>
    `rounded-full py-2 text-[13px] lowercase tracking-wide transition ${
      active ? "bg-paper text-ink shadow-sm" : "text-ink/45 hover:text-ink/70"
    }`;

  // Signed out, the rail has nothing to act on — no wallet, no position. It becomes
  // the one ask on an otherwise public page. `ready` guards the flash of it while
  // Privy is still restoring a session.
  if (ready && !authenticated) return <GuestActionRail />;

  return (
    <div className={bare ? "" : "lg:sticky lg:top-24"}>
      {/* Buy / Sell toggle — hidden in a sheet, whose title already says which. */}
      <div className={`mb-3 grid grid-cols-2 gap-1 rounded-full bg-ink/[0.05] p-1 ${bare ? "hidden" : ""}`}>
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
            // Just the figure. "max" sat here as a second way to do what the "sell
            // all" pill below already does, one line apart — two controls for one
            // act, and the quieter one looked like the real one.
            hint={
              <span>
                {price ? t("rail.worth") : t("rail.available")}: ${formatUsdAmount(positionValue)}
              </span>
            }
            // Just the act. Where it takes a hold — the app — the control says so
            // itself; a button that reads "sell" and ignores a tap is a broken button.
            actionLabel={(price ? t("rail.actionSell") : t("rail.actionWithdraw")).toLowerCase()}
            onAction={onSell}
            loading={loading}
            disabled={loading || amount <= 0 || amount > positionValue}
            variant="primary"
            // Selling is as final as buying — a market order that can't be recalled —
            // so it asks for the same deliberate press rather than a tap a thumb can
            // find by accident while scrolling.
            hold
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

          {/* What you'll actually receive, with the arithmetic behind it one tap away.
              The gap against the amount asked for is NOT a fee the sell charges: on a
              thin token the pool simply sits off the reference price the position is
              valued at, often because the spread was paid on the way IN. */}
          <SellDetails
            asked={amount}
            proceeds={sellOut.proceedsUsd}
            costFraction={sellOut.costFraction}
            quoting={sellOut.quoting}
          />

          {/* Cash all the way out — sell to USDC here, then off-ramp to a card.
              Secondary button beside the primary "sell" — same shape, lighter weight. */}
          <button
            type="button"
            onClick={() => setShowCashOut(true)}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-[14px] lowercase tracking-wide text-ink/70 transition hover:border-ink/40 hover:text-ink"
          >
            <CreditCard size={14} strokeWidth={1.5} />
            {t("rail.cashOut")}
            {!cashOutLive && (
              <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[9px] lowercase tracking-wide text-ink/45">
                {t("common.soon")}
              </span>
            )}
          </button>
        </>
      )}

      {error && <p className="mt-3 text-center text-xs text-loss">{localizeError(error, t)}</p>}

      <AnimatePresence>
        {showCashOut && <CashOutSheet onClose={() => setShowCashOut(false)} />}
      </AnimatePresence>
    </div>
  );
}
