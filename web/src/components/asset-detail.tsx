"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useYieldActions } from "@/hooks/use-yield-actions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useEarnings } from "@/hooks/use-earnings";
import { useApyHistory } from "@/hooks/use-apy-history";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { fromBaseUnits, planWithdrawal, RISK_LABEL } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { getAssetInfo } from "@/lib/yield/asset-info";
import { DepositPanel } from "@/components/deposit-panel";
import { AssetChart } from "@/components/asset-chart";
import { Sparkline } from "@/components/sparkline";
import { YieldAmountField } from "@/components/yield-amount-field";
import { YieldActionSuccess, type ActionResult } from "@/components/yield-action-success";

/** Full-page asset detail: what it is + live price/APY + chart + your position +
 *  buy/sell or deposit/withdraw. Replaces the old modal. Mounted only once the
 *  ProviderView is resolved, so its view-dependent hooks are safe. */
export function AssetDetail({ view, onDone }: { view: ProviderView; onDone: () => void }) {
  const price = isPriceExposure(view.id);
  const info = getAssetInfo(view.id);
  const { withdraw, redeemAll, loading, error } = useYieldActions(view.id);
  const apyHistory = useApyHistory(view.defiLlamaPoolId);
  const { prices } = useStockPrices(price && view.heldMint ? [view.heldMint] : []);
  const earnings = useEarnings();

  const [amount, setAmount] = useState(10);
  const [result, setResult] = useState<ActionResult | null>(null);

  const positionValue = fromBaseUnits(view.underlyingBalance, view.decimals);
  const quote = view.heldMint ? prices[view.heldMint] : undefined;
  const up = (quote?.change24h ?? 0) >= 0;
  const src = earnings.sources.find((s) => s.id === view.id);
  const earned = src ? src.currentValue - src.invested : undefined;

  const settle = () => setTimeout(onDone, 1500);

  const handleExit = async () => {
    const plan = planWithdrawal({
      requested: amount,
      positionBaseUnits: view.underlyingBalance,
      shares: view.shares,
      decimals: view.decimals,
    });
    if (!plan) return;
    if (plan.mode === "redeemAll") await redeemAll(plan.shares);
    else await withdraw(plan.amount);
    setResult({ kind: "withdraw", amount: plan.mode === "redeemAll" ? positionValue : amount, symbol: price ? "USDC" : view.assetSymbol });
    settle();
  };

  return (
    <div className="relative mx-auto max-w-[680px] pb-32 pt-2">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="lowercase text-[clamp(14px,1.3vw,18px)] text-black/45">[ {info?.category ?? (price ? "asset" : "yield source")} ]</p>
        <h1 className="mt-3 text-[clamp(28px,4.4vw,46px)] leading-[1.02] tracking-[-0.04em]">
          {view.name}
        </h1>

        {/* live headline stat */}
        <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {price ? (
            <>
              <span className="text-[clamp(26px,4vw,40px)] font-bold tabular-nums">{quote ? `$${quote.price.toFixed(2)}` : "—"}</span>
              {quote && (
                <span className={`text-[15px] tabular-nums ${up ? "text-emerald-600" : "text-red-600"}`}>
                  {up ? "+" : ""}{quote.change24h.toFixed(2)}% 24h
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-[clamp(26px,4vw,40px)] font-bold tabular-nums text-[#3c05c7]">{(view.apy * 100).toFixed(2)}%</span>
              <span className="lowercase text-[15px] text-black/45">apy · {RISK_LABEL[view.riskLevel] ?? view.riskLevel}</span>
            </>
          )}
        </div>
      </motion.div>

      {/* chart */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }} className="mt-8">
        {view.heldMint ? (
          <AssetChart mint={view.heldMint} />
        ) : apyHistory.length > 1 ? (
          <div className="rounded-[12px] border border-black/10 p-5">
            <p className="lowercase text-[13px] text-black/45 mb-3">apy · last {apyHistory.length} days</p>
            <Sparkline values={apyHistory} height={96} className="w-full h-24 text-[#3c05c7]/60" />
          </div>
        ) : null}
      </motion.div>

      {/* what it is */}
      {info && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="mt-10">
          <p className="lowercase text-[13px] text-black/45 mb-3">what it is</p>
          <p className="text-[clamp(17px,1.6vw,21px)] leading-snug text-black/80">{info.about}</p>
          {info.facts && info.facts.length > 0 && (
            <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-[12px] border border-black/10 bg-black/10 sm:grid-cols-2">
              {info.facts.map((f) => (
                <div key={f.label} className="bg-white p-4">
                  <p className="lowercase text-[12px] text-black/40">{f.label}</p>
                  <p className="mt-1 text-[15px] text-black">{f.value}</p>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* your position */}
      {positionValue > 0 && (
        <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-10 rounded-[12px] border border-[#3c05c7]/30 bg-[#3c05c7]/[0.04] p-5">
          <p className="lowercase text-[13px] text-black/55">your position</p>
          <p className="mt-1 text-[clamp(24px,3.4vw,34px)] font-bold tabular-nums">${positionValue.toFixed(2)}</p>
          <p className="mt-1 text-[13px] text-black/45">
            {price && typeof earned === "number"
              ? <span className={`tabular-nums ${earned >= 0 ? "text-emerald-600" : "text-red-600"}`}>{earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)} since you bought · on-chain p&l</span>
              : price ? "current market value" : "principal + accrued yield"}
          </p>
        </motion.section>
      )}

      {/* action */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="mt-10 space-y-4">
        <DepositPanel
          view={view}
          verb={price ? "Buy" : "Deposit"}
          onDeposited={(usd) => { setResult({ kind: "deposit", amount: usd, symbol: price ? "USDC" : view.assetSymbol }); settle(); }}
        />
        <YieldAmountField
          label={price ? `Sell ${view.assetSymbol}` : `Withdraw ${view.assetSymbol}`}
          symbol={price ? "USDC" : view.assetSymbol}
          value={amount}
          onChange={setAmount}
          hint={
            <span className="flex items-center gap-2">
              {price ? "worth" : "available"}: ${positionValue.toFixed(2)}
              {positionValue > 0 && (
                <button type="button" onClick={() => setAmount(positionValue)} className="lowercase tracking-wide text-[#3c05c7]/80 hover:text-[#3c05c7] transition">max</button>
              )}
            </span>
          }
          actionLabel={price ? "Sell" : "Withdraw"}
          onAction={handleExit}
          loading={loading}
          disabled={loading || amount <= 0 || amount > positionValue}
          variant="secondary"
        />
        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      </motion.section>

      <AnimatePresence>{result && <YieldActionSuccess result={result} onDone={() => setResult(null)} />}</AnimatePresence>
    </div>
  );
}
