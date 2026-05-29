"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";

import { useYieldActions } from "@/hooks/use-yield-actions";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { RISK_LABEL, toBaseUnits, fromBaseUnits } from "@/lib/yield";

interface Props {
  view: ProviderView;
  onClose: () => void;
  /** Called after a confirmed deposit/withdraw so the page can refresh positions. */
  onDone?: () => void;
}

export function YieldSourceSheet({ view, onClose, onDone }: Props) {
  const { deposit, withdraw, loading, error } = useYieldActions(view.id);
  const usdc = useUsdcBalance();

  const [depositAmount, setDepositAmount] = useState(50);
  const [withdrawAmount, setWithdrawAmount] = useState(10);

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
    settleAndRefresh();
  };

  const handleWithdraw = async () => {
    if (withdrawAmount <= 0 || positionValue <= 0) return;
    await withdraw(toBaseUnits(withdrawAmount, view.decimals));
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
          className="w-full max-w-[520px] bg-black border border-white/15 rounded-[12px] p-6 md:p-8 max-h-[90vh] overflow-auto"
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
            {/* Deposit */}
            <div className="p-4 rounded-[6px] border border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-2">
                Deposit {view.assetSymbol}
              </p>
              <div className="flex items-baseline gap-3">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={depositAmount}
                  onChange={(e) =>
                    setDepositAmount(Math.max(0, Number(e.target.value)))
                  }
                  className="flex-1 bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-2xl text-white py-1"
                />
                <span className="font-mono text-sm text-white/40">
                  {view.assetSymbol}
                </span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-white/30">
                wallet: ${usdc.balance.toFixed(2)} {view.assetSymbol}
              </p>
              <button
                onClick={handleDeposit}
                disabled={loading || depositAmount <= 0}
                className="mt-3 w-full px-4 py-2.5 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Working…
                  </>
                ) : (
                  "Deposit"
                )}
              </button>
            </div>

            {/* Withdraw */}
            <div className="p-4 rounded-[6px] border border-white/10">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-2">
                Withdraw {view.assetSymbol}
              </p>
              <div className="flex items-baseline gap-3">
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={withdrawAmount}
                  onChange={(e) =>
                    setWithdrawAmount(Math.max(0, Number(e.target.value)))
                  }
                  className="flex-1 bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-2xl text-white py-1"
                />
                <span className="font-mono text-sm text-white/40">
                  {view.assetSymbol}
                </span>
              </div>
              <p className="mt-2 font-mono text-[11px] text-white/30">
                available: ${positionValue.toFixed(2)}
              </p>
              <button
                onClick={handleWithdraw}
                disabled={
                  loading || withdrawAmount <= 0 || withdrawAmount > positionValue
                }
                className="mt-3 w-full px-4 py-2.5 rounded-[5px] border border-white/20 hover:border-white/40 text-white font-mono text-xs uppercase tracking-wide disabled:opacity-30 transition"
              >
                Withdraw
              </button>
            </div>
          </div>

          {error && (
            <p className="mt-4 font-mono text-xs text-red-400 text-center">
              {error}
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
