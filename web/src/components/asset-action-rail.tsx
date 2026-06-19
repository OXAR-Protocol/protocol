"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { CreditCard } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import { DepositPanel } from "@/components/deposit-panel";
import { YieldAmountField } from "@/components/yield-amount-field";
import { CashOutSheet } from "@/components/cash-out-sheet";

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
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [showCashOut, setShowCashOut] = useState(false);
  const canSell = positionValue > 0;
  const tabClass = (active: boolean) =>
    `rounded-full py-2 text-[13px] lowercase tracking-wide transition ${
      active ? "bg-white text-black shadow-sm" : "text-black/45 hover:text-black/70"
    }`;

  return (
    <div className="lg:sticky lg:top-24">
      {/* Buy / Sell toggle */}
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-black/[0.05] p-1">
        <button type="button" onClick={() => setTab("buy")} className={tabClass(tab === "buy")}>
          {price ? "buy" : "deposit"}
        </button>
        <button
          type="button"
          onClick={() => canSell && setTab("sell")}
          disabled={!canSell}
          title={canSell ? undefined : "nothing to sell yet"}
          className={`${tabClass(tab === "sell" && canSell)} disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {price ? "sell" : "withdraw"}
        </button>
      </div>

      {tab === "buy" || !canSell ? (
        <DepositPanel
          view={view}
          verb={price ? "Buy" : "Deposit"}
          onDeposited={onDeposited}
          sharePriceUsd={sharePriceUsd}
          unitLabel={unitLabel}
        />
      ) : (
        <>
          <YieldAmountField
            label={price ? `Sell ${view.assetSymbol}` : `Withdraw ${view.assetSymbol}`}
            symbol={price ? "USDC" : view.assetSymbol}
            value={amount}
            onChange={onAmountChange}
            hint={
              <span className="flex items-center gap-2">
                {price ? "worth" : "available"}: ${positionValue.toFixed(2)}
                <button
                  type="button"
                  onClick={() => onAmountChange(positionValue)}
                  className="lowercase tracking-wide text-[#3c05c7]/80 transition hover:text-[#3c05c7]"
                >
                  max
                </button>
              </span>
            }
            actionLabel={price ? "Sell" : "Withdraw"}
            onAction={onSell}
            loading={loading}
            disabled={loading || amount <= 0 || amount > positionValue}
            variant="primary"
          />

          {/* Cash all the way out — sell to USDC here, then off-ramp to a card.
              Secondary button beside the primary "sell" — same shape, lighter weight. */}
          <button
            type="button"
            onClick={() => setShowCashOut(true)}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-3 text-[14px] lowercase tracking-wide text-black/70 transition hover:border-black/40 hover:text-black"
          >
            <CreditCard size={14} strokeWidth={1.5} />
            cash out to card
            <span className="rounded-full bg-black/[0.06] px-2 py-0.5 text-[9px] lowercase tracking-wide text-black/45">
              soon
            </span>
          </button>
        </>
      )}

      {error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}

      <AnimatePresence>
        {showCashOut && <CashOutSheet onClose={() => setShowCashOut(false)} />}
      </AnimatePresence>
    </div>
  );
}
