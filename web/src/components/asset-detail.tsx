"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { useEarnings } from "@/hooks/use-earnings";
import { useApyHistory } from "@/hooks/use-apy-history";
import { useSwapOutPreview } from "@/hooks/use-swap-out-preview";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { fromBaseUnits, planWithdrawal } from "@/lib/yield";
import { settledAmount } from "@/lib/yield/settled";
import { PhotoBg } from "@/components/photo-bg";
import { useT } from "@/lib/i18n";
import { isPriceExposure } from "@/lib/yield/assets";
import { getAssetInfo } from "@/lib/yield/asset-info";
import { AssetActionRail } from "@/components/asset-action-rail";
import { AssetActionBar } from "@/components/asset-action-bar";
import { AssetTrustStrip } from "@/components/asset-trust-strip";
import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc } from "@/lib/yield/asset-logo";
import { AssetChart } from "@/components/asset-chart";
import { HoverChart } from "@/components/hover-chart";
import { YieldActionSuccess, type ActionResult } from "@/components/yield-action-success";
import { ActivityFeed } from "@/components/activity-feed";
import { AssetProof } from "@/components/asset-proof";

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
  const { t, locale } = useT();
  const info = getAssetInfo(view.id, locale);
  const { walletAddress, connection } = useSolanaContext();
  const { withdraw, redeemAll, loading, error } = useYieldActions(view.id);
  const apyHistory = useApyHistory(view.defiLlamaPoolId);
  const { prices } = useStockPrices(price && view.heldMint ? [view.heldMint] : []);
  const earnings = useEarnings();

  const [amount, setAmount] = useState(0);
  const [result, setResult] = useState<ActionResult | null>(null);

  const positionValue = fromBaseUnits(view.underlyingBalance, view.decimals);
  // What the whole position would actually fetch right now — a real quote, not the
  // reference price times the balance.
  const realizable = useSwapOutPreview({
    heldMint: view.heldMint,
    shares: view.shares,
    positionValue,
    usdAmount: positionValue,
    enabled: positionValue > 0 && !!view.heldMint,
  });
  const quote = view.heldMint ? prices[view.heldMint] : undefined;
  // Price of one unit, when a unit has one (stocks, gold) — lets a receipt say
  // "0.0023 ORO" rather than only the dollars that moved.
  const sharePriceUsd = price ? quote?.price : undefined;
  const up = (quote?.change24h ?? 0) >= 0;
  const src = earnings.sources.find((s) => s.id === view.id);
  const earned = src ? src.currentValue - src.invested : undefined;
  // Unit label for the quantity input — the ticker in the name, e.g. "SPCXx".
  const unitLabel = view.name.match(/\(([^)]+)\)/)?.[1] ?? "units";

  // Refresh the position after an action. The tx is already confirmed here, but the
  // balance read (RPC / holdings indexer) can lag a beat behind a swap-sell — a single
  // delayed refresh sometimes caught the STALE balance, so a just-sold asset still
  // looked sellable ("sell it again"). Refresh now AND again shortly after to catch lag.
  const settle = () => {
    onDone();
    setTimeout(onDone, 3000);
  };

  const handleExit = async () => {
    const plan = planWithdrawal({
      requested: amount,
      positionBaseUnits: view.underlyingBalance,
      shares: view.shares,
      decimals: view.decimals,
    });
    if (!plan) return;
    const sig =
      plan.mode === "redeemAll"
        ? await redeemAll(plan.shares, positionValue)
        : await withdraw(plan.amount);
    // Report what SETTLED, not what was asked for: a sell quoted at $4.94 landed
    // $4.84, and echoing the request turned the receipt into a guess. Falls back to
    // the requested figure only if the transaction can't be read yet.
    const requested = plan.mode === "redeemAll" ? positionValue : amount;
    const landed = walletAddress
      ? await settledAmount(connection, sig, walletAddress, view.assetMint)
      : null;
    const soldUnits =
      sharePriceUsd && sharePriceUsd > 0 ? requested / sharePriceUsd : undefined;
    setResult({
      kind: "withdraw",
      amount: landed !== null && landed > BigInt(0) ? fromBaseUnits(landed, view.decimals) : requested,
      symbol: price ? "USDC" : view.assetSymbol,
      units: soldUnits,
      unitLabel: soldUnits !== undefined ? unitLabel : undefined,
      assetId: view.id,
    });
    settle();
  };

  // The bottom padding clears the buy/sell bar alone — the tab bar hides on this
  // page (see `TabBar`), so the page no longer has to make room for both.
  return (
    <div className="relative mx-auto max-w-[1100px] pb-28 pt-2 lg:pb-32">
      {/* Headline */}
      <motion.div {...fade(0)} className="flex items-start gap-4">
        <AssetIcon
          src={assetLogoSrc(view.id)}
          label={unitLabel !== "units" ? unitLabel : view.assetSymbol}
          size={56}
          className="mt-1.5"
        />
        <div className="min-w-0 flex-1">
        <p className="lowercase text-[clamp(14px,1.3vw,18px)] text-ink/45">[ {info?.category ?? (price ? "asset" : "yield source")} ]</p>
        <h1 className="mt-3 flex flex-wrap items-baseline gap-x-3 text-[clamp(28px,4.4vw,46px)] leading-[1.02] tracking-[-0.04em]">
          {view.name}
        </h1>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1">
          {price ? (
            <>
              <span className="text-[clamp(26px,4vw,40px)] font-bold tabular-nums">{quote ? `$${quote.price.toFixed(2)}` : "—"}</span>
              {quote && (
                <span className={`text-[15px] tabular-nums ${up ? "text-profit" : "text-loss"}`}>
                  {up ? "+" : ""}{quote.change24h.toFixed(2)}% 24h
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-[clamp(26px,4vw,40px)] font-bold tabular-nums text-[var(--brand)]">{(view.apy * 100).toFixed(2)}%</span>
              <span className="lowercase text-[15px] text-ink/45">{t("asset.apy")} · {t(`risk.${view.riskLevel}`)}</span>
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
                      ? "border-[var(--brand)] bg-[var(--brand)]/[0.05] text-ink"
                      : "border-ink/10 text-ink/60 hover:border-ink/30 hover:text-ink"
                  }`}
                >
                  <span className="font-medium">{v.assetSymbol}</span>
                  <span className="tabular-nums text-[var(--brand)]">{(v.apy * 100).toFixed(2)}%</span>
                </button>
              );
            })}
          </div>
        )}
        </div>
      </motion.div>

      {/* Trust strip: TVL social-proof + non-custodial guarantees */}
      <AssetTrustStrip view={view} />

      {/* Your position first. On a page you opened BECAUSE you hold it, how you're
          doing outranks what the thing is — it used to sit below the chart and the essay. */}
      {positionValue > 0 && (
        <motion.section
          {...fade(0.08)}
          className="relative mt-6 overflow-hidden rounded-[12px] border border-ink/10 bg-paper p-5"
        >
          {/* The wallet card's treatment, not a violet wash: a white card and a real
              photograph. The engraving at 6% behind a purple tint read as a smudge —
              a picture you can't quite see is worse than no picture.
              Turned down to 30%, like the balance card it echoes: the scrim only holds
              white for the first two thirds, and "sell now: … above market value" runs
              the whole way across — past the scrim it was reading over bare engraving. */}
          <PhotoBg
            src="/art/dripping-dollar.webp"
            scrim="left"
            position="object-[right_top]"
            zoomOnMobile
            opacity="opacity-30"
          />
          <div className="relative">
          <p className="lowercase text-[13px] text-ink/55">{t("asset.yourPosition")}</p>
          <p className="mt-1 text-[clamp(24px,3.4vw,34px)] font-bold tabular-nums">
            ${positionValue.toFixed(2)}
          </p>
          {/* The figure above is the market reference price. For a thinly traded token
              the pool can sit a couple of percent either side of it, so what you could
              actually walk away with is quoted separately — never inferred. */}
          {realizable.proceedsUsd !== null && (
            <p className="mt-1 text-[13px] tabular-nums text-ink/70">
              {t("asset.sellNow")}: ${realizable.proceedsUsd.toFixed(2)}
              {Math.abs(realizable.proceedsUsd - positionValue) >= 0.01 && (
                <span className="text-ink/45">
                  {" · "}
                  {t(
                    realizable.proceedsUsd < positionValue
                      ? "asset.belowMarket"
                      : "asset.aboveMarket",
                    {
                      pct: (
                        Math.abs((realizable.proceedsUsd - positionValue) / positionValue) * 100
                      ).toFixed(1),
                    },
                  )}
                </span>
              )}
            </p>
          )}
          <p className="mt-1 text-[13px] text-ink/45">
            {price && typeof earned === "number" ? (
              <span className={`tabular-nums ${earned >= 0 ? "text-profit" : "text-loss"}`}>
                {earned >= 0 ? "+" : "−"}${Math.abs(earned).toFixed(2)} {t("asset.sinceYouBought")}
              </span>
            ) : price ? (
              t("asset.marketValue")
            ) : (
              t("asset.principalYield")
            )}
          </p>
          </div>
        </motion.section>
      )}

      {/* Two columns: content + sticky action rail */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left: chart + about + position */}
        <div className="min-w-0">
          <motion.div {...fade(0.05)}>
            {view.heldMint ? (
              <AssetChart mint={view.heldMint} />
            ) : apyHistory.length > 1 ? (
              <div data-tour="chart">
                <p className="mb-3 lowercase text-[13px] text-ink/45">{t("asset.apyLastDays", { n: apyHistory.length })}</p>
                <div className="-mx-5 sm:mx-0">
                  <HoverChart
                    values={apyHistory}
                    height={220}
                    fill
                    format={(v) => `${v.toFixed(2)}%`}
                    className="text-[var(--brand)]/70"
                  />
                </div>
              </div>
            ) : null}
          </motion.div>

          {info && (
            <motion.section {...fade(0.1)} className="mt-10">
              <p className="lowercase text-[13px] text-ink/45 mb-3">{t("asset.whatItIs")}</p>
              <p className="text-[clamp(17px,1.6vw,21px)] leading-snug text-ink/80">{info.about}</p>
              {info.facts && info.facts.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-[12px] border border-ink/10 bg-ink/10 sm:grid-cols-2">
                  {info.facts.map((f, i) => {
                    // An odd last fact would leave an empty 2nd cell showing the grey
                    // grid background — span it full width so the row stays filled.
                    const spanFull = i === info.facts!.length - 1 && info.facts!.length % 2 === 1;
                    return (
                      <div key={f.label} className={`bg-paper p-4 ${spanFull ? "sm:col-span-2" : ""}`}>
                        <p className="lowercase text-[12px] text-ink/40">{f.label}</p>
                        <p className="mt-1 text-[15px] text-ink">{f.value}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.section>
          )}

          <motion.section {...fade(0.18)}>
            <AssetProof id={view.id} />
          </motion.section>

          {/* "your history with this" needs a "you". Signed out it read as an empty
              ledger — a promise of nothing — so it isn't offered at all. */}
          {view.heldMint && walletAddress && (
            <motion.section {...fade(0.2)} className="mt-10">
              <p className="mb-3 lowercase text-[13px] text-ink/45">{t("asset.history")}</p>
              {/* Only this asset's rows — a ledger of everything belongs in the portfolio. */}
              <ActivityFeed mint={view.heldMint} unitLabel={unitLabel} />
            </motion.section>
          )}
        </div>

        {/* Desktop: the rail beside the chart. On a phone it moves into a sheet
            raised by the bar at the bottom — see AssetActionBar. */}
        <motion.div {...fade(0.2)} className="hidden lg:block">
          <AssetActionRail
            view={view}
            price={price}
            positionValue={positionValue}
            amount={amount}
            onAmountChange={setAmount}
            onDeposited={(usd, pending) => {
              const boughtUnits = sharePriceUsd && sharePriceUsd > 0 ? usd / sharePriceUsd : undefined;
              setResult({
                kind: "deposit",
                amount: usd,
                symbol: price ? "USDC" : view.assetSymbol,
                pending,
                units: boughtUnits,
                unitLabel: boughtUnits !== undefined ? unitLabel : undefined,
                assetId: view.id,
              });
              settle();
            }}
            onSell={handleExit}
            loading={loading}
            error={error}
            sharePriceUsd={sharePriceUsd}
            unitLabel={unitLabel}
          />
        </motion.div>
      </div>

      {/* Phone: the two acts wait at the bottom instead of sitting open halfway
          down the page, asking what to pay with before anyone said they'd buy. */}
      <AssetActionBar
        view={view}
        price={price}
        positionValue={positionValue}
        amount={amount}
        onAmountChange={setAmount}
        onDeposited={(usd, pending) => {
          const boughtUnits = sharePriceUsd && sharePriceUsd > 0 ? usd / sharePriceUsd : undefined;
          setResult({
            kind: "deposit",
            amount: usd,
            symbol: price ? "USDC" : view.assetSymbol,
            pending,
            units: boughtUnits,
            unitLabel: boughtUnits !== undefined ? unitLabel : undefined,
            assetId: view.id,
          });
          settle();
        }}
        onSell={handleExit}
        loading={loading}
        error={error}
        sharePriceUsd={sharePriceUsd}
        unitLabel={unitLabel}
      />

      <AnimatePresence>{result && <YieldActionSuccess result={result} onDone={() => setResult(null)} address={walletAddress?.toBase58()} />}</AnimatePresence>
    </div>
  );
}
