"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { useYieldActions } from "@/hooks/use-yield-actions";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { RISK_LABEL, toBaseUnits, fromBaseUnits, planWithdrawal } from "@/lib/yield";
import { YieldAmountField } from "@/components/yield-amount-field";
import {
  YieldActionSuccess,
  type ActionResult,
} from "@/components/yield-action-success";

interface Props {
  view: ProviderView;
  onClose: () => void;
  /** Called after a confirmed deposit/withdraw so the page can refresh positions. */
  onDone?: () => void;
}

export function YieldSourceSheet({ view, onClose, onDone }: Props) {
  const { deposit, withdraw, redeemAll, loading, error } = useYieldActions(view.id);
  const usdc = useUsdcBalance();

  const [depositAmount, setDepositAmount] = useState(50);
  const [withdrawAmount, setWithdrawAmount] = useState(10);
  const [result, setResult] = useState<ActionResult | null>(null);

  const positionValue = fromBaseUnits(view.underlyingBalance, view.decimals);

  // The tx confirms at "confirmed" commitment, but the position/balance reads can
  // still lag a slot — refresh after a short beat so the user doesn't see stale $0.
  const settleAndRefresh = () => {
    setTimeout(() => {
      usdc.refetch();
      onDone?.();
    }, 1500);
  };

  const handleDeposit = async () => {
    if (depositAmount <= 0) return;
    await deposit(toBaseUnits(depositAmount, view.decimals));
    setResult({ kind: "deposit", amount: depositAmount, symbol: view.assetSymbol });
    settleAndRefresh();
  };

  const handleWithdraw = async () => {
    // planWithdrawal decides full-exit (redeem all shares) vs partial in base units —
    // a full exit avoids the share→asset rounding wall that stranded dust.
    const plan = planWithdrawal({
      requested: withdrawAmount,
      positionBaseUnits: view.underlyingBalance,
      shares: view.shares,
      decimals: view.decimals,
    });
    if (!plan) return;
    if (plan.mode === "redeemAll") {
      await redeemAll(plan.shares);
    } else {
      await withdraw(plan.amount);
    }
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
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
                Yield source
              </p>
              <h2 className="mt-2 font-sans text-2xl text-white">{view.name}</h2>
              <p className="mt-1 font-mono text-xs text-white/40">
                {view.description}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white transition"
            >
              <X size={18} strokeWidth={1.5} />
            </button>
          </div>

          {/* APY + risk */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-4 rounded-[6px] border border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">
                APY
              </p>
              <p className="mt-1 font-sans text-2xl text-white tabular-nums">
                {(view.apy * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-4 rounded-[6px] border border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">
                Risk
              </p>
              <p className="mt-1 font-sans text-2xl text-white">
                {RISK_LABEL[view.riskLevel] ?? view.riskLevel}
              </p>
            </div>
          </div>

          {/* Position */}
          {positionValue > 0 && (
            <div className="mb-6 p-4 rounded-[6px] border border-accent/30 bg-accent/[0.04]">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/50">
                Your position
              </p>
              <p className="mt-1 font-sans text-2xl text-white tabular-nums">
                ${positionValue.toFixed(2)}
              </p>
              <p className="mt-1 font-mono text-[11px] text-white/40">
                principal + accrued yield
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-4">
            <YieldAmountField
              label={`Deposit ${view.assetSymbol}`}
              symbol={view.assetSymbol}
              value={depositAmount}
              onChange={setDepositAmount}
              hint={`wallet: $${usdc.balance.toFixed(2)} ${view.assetSymbol}`}
              actionLabel="Deposit"
              onAction={handleDeposit}
              loading={loading}
              disabled={loading || depositAmount <= 0}
              variant="primary"
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
            <p className="mt-4 font-mono text-xs text-red-400 text-center">
              {error}
            </p>
          )}

          <AnimatePresence>
            {result && (
              <YieldActionSuccess
                result={result}
                onDone={() => setResult(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
