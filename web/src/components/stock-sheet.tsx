"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { useYieldActions } from "@/hooks/use-yield-actions";
import type { ProviderView } from "@/hooks/use-yield-positions";
import type { StockPrice } from "@/hooks/use-stock-prices";
import { fromBaseUnits, planWithdrawal } from "@/lib/yield";
import { YieldAmountField } from "@/components/yield-amount-field";
import { DepositPanel } from "@/components/deposit-panel";
import { YieldActionSuccess, type ActionResult } from "@/components/yield-action-success";

interface Props {
  view: ProviderView;
  token: string;
  name: string;
  price?: StockPrice;
  /** Realized + unrealized P&L in USD (current value − on-chain cost basis). */
  earned?: number;
  onClose: () => void;
  onDone?: () => void;
}

/** Buy/sell a tokenized stock — price-framed (not yield). Buy = swap USDC→xStock,
 *  sell = swap back; reuses the deposit/withdraw rails under stock labels. */
export function StockSheet({ view, token, name, price, earned, onClose, onDone }: Props) {
  const { withdraw, redeemAll, loading, error } = useYieldActions(view.id);
  const [sellAmount, setSellAmount] = useState(10);
  const [result, setResult] = useState<ActionResult | null>(null);

  const holdings = fromBaseUnits(view.underlyingBalance, view.decimals);
  const up = (price?.change24h ?? 0) >= 0;
  const settleAndRefresh = () => setTimeout(() => onDone?.(), 1500);

  const handleSell = async () => {
    const plan = planWithdrawal({
      requested: sellAmount,
      positionBaseUnits: view.underlyingBalance,
      shares: view.shares,
      decimals: view.decimals,
    });
    if (!plan) return;
    if (plan.mode === "redeemAll") await redeemAll(plan.shares);
    else await withdraw(plan.amount);
    setResult({ kind: "withdraw", amount: plan.mode === "redeemAll" ? holdings : sellAmount, symbol: "USDC" });
    settleAndRefresh();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center px-4 pb-4 md:pb-0"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 220 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[520px] bg-black border border-white/15 rounded-[12px] p-6 md:p-8 max-h-[90vh] overflow-auto"
        >
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">Stock</p>
              <h2 className="mt-2 font-sans text-2xl text-white">{token}</h2>
              <p className="mt-1 font-mono text-xs text-white/40">{name} · tokenized · non-US</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Price */}
          <div className="mb-6 p-4 rounded-[6px] border border-white/10">
            <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">Price</p>
            <div className="mt-1 flex items-baseline gap-3">
              <p className="font-sans text-2xl text-white tabular-nums">
                {price ? `$${price.price.toFixed(2)}` : "—"}
              </p>
              {price && (
                <span className={`font-mono text-xs tabular-nums ${up ? "text-emerald-400/80" : "text-red-400/80"}`}>
                  {up ? "+" : ""}
                  {price.change24h.toFixed(2)}% 24h
                </span>
              )}
            </div>
          </div>

          {/* Position + P&L */}
          {holdings > 0 && (
            <div className="mb-6 p-4 rounded-[6px] border border-accent/30 bg-accent/[0.04]">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/50">Your position</p>
              <p className="mt-1 font-sans text-2xl text-white tabular-nums">${holdings.toFixed(2)}</p>
              {typeof earned === "number" && (
                <p className={`mt-1 font-mono text-[11px] tabular-nums ${earned >= 0 ? "text-emerald-400/80" : "text-red-400/80"}`}>
                  {earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)} since you bought · on-chain P&L
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <DepositPanel
              view={view}
              verb="Buy"
              onDeposited={(usd) => {
                setResult({ kind: "deposit", amount: usd, symbol: "USDC" });
                settleAndRefresh();
              }}
            />

            <YieldAmountField
              label={`Sell ${token}`}
              symbol="USDC"
              value={sellAmount}
              onChange={setSellAmount}
              hint={
                <span className="flex items-center gap-2">
                  worth: ${holdings.toFixed(2)}
                  {holdings > 0 && (
                    <button
                      type="button"
                      onClick={() => setSellAmount(holdings)}
                      className="uppercase tracking-wide text-accent/80 hover:text-accent transition"
                    >
                      max
                    </button>
                  )}
                </span>
              }
              actionLabel="Sell"
              onAction={handleSell}
              loading={loading}
              disabled={loading || sellAmount <= 0 || sellAmount > holdings}
              variant="secondary"
            />
          </div>

          {error && <p className="mt-4 font-mono text-xs text-red-400 text-center">{error}</p>}

          <AnimatePresence>
            {result && <YieldActionSuccess result={result} onDone={() => setResult(null)} />}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
