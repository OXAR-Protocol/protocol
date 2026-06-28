"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useEarnings } from "@/hooks/use-earnings";
import { useApyHistory } from "@/hooks/use-apy-history";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { fromBaseUnits, planWithdrawal, RISK_LABEL } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { getAssetInfo } from "@/lib/yield/asset-info";
import { AssetActionRail } from "@/components/asset-action-rail";
import { AssetTrustStrip } from "@/components/asset-trust-strip";
import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc } from "@/lib/yield/asset-logo";
import { AssetChart } from "@/components/asset-chart";
import { HoverChart } from "@/components/hover-chart";
import { YieldActionSuccess, type ActionResult } from "@/components/yield-action-success";

const fade = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay },
});

/** Full-page asset detail, Ondo-style: live price/APY + area chart on the left,
 *  a sticky buy/sell rail on the right, curated "what it is" + position below.
 *  Mounted only once the ProviderView is resolved, so view-hooks are safe. */
export function AssetDetail({
  view,
  variants,
  onSelectVariant,
  onDone,
}: {
  view: ProviderView;
  /** Sibling markets of the same protocol (e.g. Jupiter Lend USDC/USDT/USDG). */
  variants?: ProviderView[];
  onSelectVariant?: (id: string) => void;
  onDone: () => void;
}) {
  const price = isPriceExposure(view.id);
  const info = getAssetInfo(view.id);
  const { walletAddress } = useSolanaContext();
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
  // Unit label for the quantity input — the ticker in the name, e.g. "SPCXx".
  const unitLabel = view.name.match(/\(([^)]+)\)/)?.[1] ?? "units";

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
    <div className="relative mx-auto max-w-[1100px] pb-32 pt-2">
      {/* Headline */}
      <motion.div {...fade(0)} className="flex items-start gap-4">
        <AssetIcon
          src={assetLogoSrc(view.id)}
          label={unitLabel !== "units" ? unitLabel : view.assetSymbol}
          size={56}
          className="mt-1.5"
        />
        <div className="min-w-0 flex-1">
        <p className="lowercase text-[clamp(14px,1.3vw,18px)] text-black/45">[ {info?.category ?? (price ? "asset" : "yield source")} ]</p>
        <h1 className="mt-3 flex flex-wrap items-baseline gap-x-3 text-[clamp(28px,4.4vw,46px)] leading-[1.02] tracking-[-0.04em]">
          {view.name}
        </h1>
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

        {/* Stablecoin picker for grouped markets (Jupiter Lend USDC/USDT/USDG) —
            each with its own APY; selecting switches the deposit target. */}
        {variants && variants.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {variants.map((v) => {
              const active = v.id === view.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onSelectVariant?.(v.id)}
                  className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] transition ${
                    active
                      ? "border-[#3c05c7] bg-[#3c05c7]/[0.05] text-black"
                      : "border-black/10 text-black/60 hover:border-black/30 hover:text-black"
                  }`}
                >
                  <span className="font-medium">{v.assetSymbol}</span>
                  <span className="tabular-nums text-[#3c05c7]">{(v.apy * 100).toFixed(2)}%</span>
                </button>
              );
            })}
          </div>
        )}
        </div>
      </motion.div>

      {/* Trust strip: TVL social-proof + non-custodial guarantees */}
      <AssetTrustStrip view={view} />

      {/* Two columns: content + sticky action rail */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: chart + about + position */}
        <div className="min-w-0">
          <motion.div {...fade(0.05)}>
            {view.heldMint ? (
              <AssetChart mint={view.heldMint} />
            ) : apyHistory.length > 1 ? (
              <div className="rounded-[12px] border border-black/10 p-5">
                <p className="lowercase text-[13px] text-black/45 mb-3">apy · last {apyHistory.length} days</p>
                <HoverChart
                  values={apyHistory}
                  height={220}
                  fill
                  format={(v) => `${v.toFixed(2)}%`}
                  className="text-[#3c05c7]/70"
                />
              </div>
            ) : null}
          </motion.div>

          {info && (
            <motion.section {...fade(0.1)} className="mt-10">
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

          {positionValue > 0 && (
            <motion.section {...fade(0.15)} className="mt-10 rounded-[12px] border border-[#3c05c7]/30 bg-[#3c05c7]/[0.04] p-5">
              <p className="lowercase text-[13px] text-black/55">your position</p>
              <p className="mt-1 text-[clamp(24px,3.4vw,34px)] font-bold tabular-nums">${positionValue.toFixed(2)}</p>
              <p className="mt-1 text-[13px] text-black/45">
                {price && typeof earned === "number"
                  ? <span className={`tabular-nums ${earned >= 0 ? "text-emerald-600" : "text-red-600"}`}>{earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)} since you bought · on-chain p&l</span>
                  : price ? "current market value" : "principal + accrued yield"}
              </p>
            </motion.section>
          )}
        </div>

        {/* Right: sticky buy/sell rail */}
        <motion.div {...fade(0.2)}>
          <AssetActionRail
            view={view}
            price={price}
            positionValue={positionValue}
            amount={amount}
            onAmountChange={setAmount}
            onDeposited={(usd, pending) => { setResult({ kind: "deposit", amount: usd, symbol: price ? "USDC" : view.assetSymbol, pending }); settle(); }}
            onSell={handleExit}
            loading={loading}
            error={error}
            sharePriceUsd={price ? quote?.price : undefined}
            unitLabel={unitLabel}
          />
        </motion.div>
      </div>

      <AnimatePresence>{result && <YieldActionSuccess result={result} onDone={() => setResult(null)} address={walletAddress?.toBase58()} />}</AnimatePresence>
    </div>
  );
}
