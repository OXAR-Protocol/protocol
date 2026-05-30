"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { useYieldActions } from "@/hooks/use-yield-actions";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { RISK_LABEL, fromBaseUnits, planWithdrawal } from "@/lib/yield";
import { YieldAmountField } from "@/components/yield-amount-field";
import { DepositPanel } from "@/components/deposit-panel";
import {
  YieldActionSuccess,
  type ActionResult,
} from "@/components/yield-action-success";

interface Props {
  /** One provider, or a group (e.g. Jupiter USDC/USDT/USDG) with an asset picker. */
  views: ProviderView[];
  onClose: () => void;
  /** Called after a confirmed deposit/withdraw so the page can refresh positions. */
  onDone?: () => void;
}

export function YieldSourceSheet({ views, onClose, onDone }: Props) {
  const [selectedId, setSelectedId] = useState(views[0].id);
  const view = views.find((v) => v.id === selectedId) ?? views[0];

  const { withdraw, redeemAll, loading, error } = useYieldActions(view.id);

  const [withdrawAmount, setWithdrawAmount] = useState(10);
  const [result, setResult] = useState<ActionResult | null>(null);

  const positionValue = fromBaseUnits(view.underlyingBalance, view.decimals);

  // Confirmed commitment can still lag a slot — refresh after a beat to avoid stale $0.
  const settleAndRefresh = () => {
    setTimeout(() => {
      onDone?.();
    }, 1500);
  };

  const handleWithdraw = async () => {
    const plan = planWithdrawal({
      requested: withdrawAmount,
      positionBaseUnits: view.underlyingBalance,
      shares: view.shares,
      decimals: view.decimals,
    });
    if (!plan) return;
    if (plan.mode === "redeemAll") await redeemAll(plan.shares);
    else await withdraw(plan.amount);
    setResult({
      kind: "withdraw",
      amount: plan.mode === "redeemAll" ? positionValue : withdrawAmount,
      symbol: view.assetSymbol,
    });
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
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                Yield source
              </p>
              <h2 className="mt-2 font-sans text-2xl text-white">{view.name}</h2>
              <p className="mt-1 font-mono text-xs text-white/40">{view.description}</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition">
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* Stablecoin picker (grouped sources only) */}
          {views.length > 1 && (
            <div className="flex gap-1.5 mb-5">
              {views.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedId(v.id)}
                  className={`flex-1 px-3 py-2 rounded-[6px] border font-mono text-xs uppercase tracking-wide transition ${
                    v.id === view.id
                      ? "border-accent/60 bg-accent/[0.06] text-white"
                      : "border-white/10 text-white/50 hover:border-white/30"
                  }`}
                >
                  {v.assetSymbol}
                  <span className="block text-[10px] text-white/40 mt-0.5 tabular-nums">
                    {(v.apy * 100).toFixed(2)}%
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-[6px] border border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">APY</p>
              <p className="mt-1 font-sans text-2xl text-white tabular-nums">
                {(view.apy * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-4 rounded-[6px] border border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">Risk</p>
              <p className="mt-1 font-sans text-2xl text-white">
                {RISK_LABEL[view.riskLevel] ?? view.riskLevel}
              </p>
            </div>
          </div>

          {positionValue > 0 && (
            <div className="mb-6 p-4 rounded-[6px] border border-accent/30 bg-accent/[0.04]">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/50">
                Your position
              </p>
              <p className="mt-1 font-sans text-2xl text-white tabular-nums">
                ${positionValue.toFixed(2)}
              </p>
              <p className="mt-1 font-mono text-[11px] text-white/40">principal + accrued yield</p>
            </div>
          )}

          <div className="space-y-4">
            <DepositPanel
              view={view}
              onDeposited={(usd) => {
                setResult({ kind: "deposit", amount: usd, symbol: view.assetSymbol });
                settleAndRefresh();
              }}
            />

            <YieldAmountField
              label={`Withdraw ${view.assetSymbol}`}
              symbol={view.assetSymbol}
              value={withdrawAmount}
              onChange={setWithdrawAmount}
              hint={
                <span className="flex items-center gap-2">
                  available: ${positionValue.toFixed(2)}
                  {positionValue > 0 && (
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(positionValue)}
                      className="uppercase tracking-wide text-accent/80 hover:text-accent transition"
                    >
                      max
                    </button>
                  )}
                </span>
              }
              actionLabel="Withdraw"
              onAction={handleWithdraw}
              loading={loading}
              disabled={loading || withdrawAmount <= 0 || withdrawAmount > positionValue}
              variant="secondary"
            />
          </div>

          {error && (
            <p className="mt-4 font-mono text-xs text-red-400 text-center">{error}</p>
          )}

          <AnimatePresence>
            {result && (
              <YieldActionSuccess result={result} onDone={() => setResult(null)} />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
