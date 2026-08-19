"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Wallet } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { PickBar } from "@/components/pick-bar";
import { AllocationSheet } from "@/components/allocation-sheet";
import { FundSheet } from "@/components/fund-sheet";
import { useBulkTrade } from "@/hooks/use-bulk-trade";
import { useBasketBuy } from "@/hooks/use-basket-buy";
import { useStockPrices } from "@/hooks/use-stock-prices";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { fromBaseUnits, getProvider, positionTitle, unitLabelOf, toFriendlyError } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/en";

interface Props {
  /** Everything the page knows about — the source of both what's picked and what
   *  the alternatives to it are. */
  views: readonly ProviderView[];
  picked: ReadonlySet<string>;
  /** Which ids should stay ticked after a run — the ones still needing a decision. */
  onOutcome: (stillSelected: ReadonlySet<string>) => void;
  onClear: () => void;
  /** Trade one pick for a sibling market, carrying its amount across. */
  onSwap?: (from: string, to: string) => void;
  /** Money moved on-chain; whoever owns the list should re-read it. */
  onDone?: () => void;
}

/**
 * A picked basket, and both things you can do with it.
 *
 * One component for the market and for your own holdings, because the difference
 * between them was never real: the market could only buy, the portfolio could only
 * sell, and wanting more of something you already held meant going somewhere else to
 * ask for it. What you can do depends on what you hold, not on which page you are
 * standing on.
 */
export function BasketBar({ views, picked, onOutcome, onClear, onSwap, onDone }: Props) {
  const { t } = useT();
  const bulk = useBulkTrade();
  const money = useBasketBuy(bulk.run);
  const [sheet, setSheet] = useState<"buy" | "sell" | null>(null);
  const [funding, setFunding] = useState(false);
  // Which way the money is going in the run that's happening — the sheet can be
  // closed while it runs, and "buying 2 of 3" under a sale is a lie.
  const [running, setRunning] = useState<"buy" | "sell">("buy");

  const pickedViews = views.filter((v) => picked.has(v.id));
  const held = pickedViews.filter((v) => v.underlyingBalance > BigInt(0));
  const heldUsd = held.reduce((sum, v) => sum + fromBaseUnits(v.underlyingBalance, v.decimals), 0);

  // Prices for the picked price-exposure assets, so a buy row can be typed in shares.
  const { prices } = useStockPrices(
    pickedViews.filter((v) => isPriceExposure(v.id) && v.heldMint).map((v) => v.heldMint as string),
  );

  const buyRows = [...picked]
    .map((id) => {
      const p = getProvider(id);
      if (!p) return null;
      // Same product, different settlement currency — Jupiter Lend's USDC beside its
      // USDT. Members of a real pair share one NAME and differ only in what you pay with.
      const alternatives = views
        .filter((o) => !!p.group && o.group === p.group && o.name === p.name && o.id !== p.id && !picked.has(o.id))
        .map((o) => ({ id: o.id, label: unitLabelOf(o), apy: o.apy }));
      const price = p.heldMint ? prices[p.heldMint]?.price : undefined;
      const unit = isPriceExposure(p.id) && price ? { unitPriceUsd: price, unitLabel: unitLabelOf(p) } : {};
      return { id, name: positionTitle(p), symbol: p.assetSymbol, alternatives, ...unit };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  const sellRows = held.map((v) => {
    const usd = fromBaseUnits(v.underlyingBalance, v.decimals);
    // What one unit is worth, read off the position itself — no price call: we
    // already know what it's worth and how many of it there are.
    const units = isPriceExposure(v.id) && v.heldDecimals !== undefined ? Number(v.shares) / 10 ** v.heldDecimals : 0;
    return {
      id: v.id,
      name: positionTitle(v),
      symbol: v.assetSymbol,
      maxUsd: usd,
      ...(units > 0 ? { unitPriceUsd: usd / units, unitLabel: unitLabelOf(v) } : {}),
    };
  });

  const finish = (outcomes: { id: string; ok: boolean }[], clearOnSuccess: boolean) => {
    onOutcome(new Set(outcomes.filter((o) => !o.ok).map((o) => o.id)));
    if (outcomes.length > 0 && outcomes.every((o) => o.ok)) {
      setSheet(null);
      if (clearOnSuccess) onClear();
      // A finished run must not colour the next selection.
      bulk.reset();
    }
    onDone?.();
  };

  const sell = async (amounts: Record<string, number>) => {
    setRunning("sell");
    const outcomes = await bulk.run(
      held
        .filter((v) => amounts[v.id] === undefined || (amounts[v.id] ?? 0) > 0)
        .map((v) => ({
          kind: "sell" as const,
          id: v.id,
          shares: v.shares,
          valueUsd: fromBaseUnits(v.underlyingBalance, v.decimals),
          ...(amounts[v.id] !== undefined ? { amountUsd: amounts[v.id] } : {}),
        })),
    );
    finish(outcomes, false);
  };

  const buy = async (amounts: Record<string, number>) => {
    setRunning("buy");
    const outcomes = await money.buy(amounts);
    finish(outcomes, true);
  };

  // Money in is a SIDE errand — it raises the budget, it doesn't buy anything. It also
  // takes over the screen, so the basket steps aside for it and comes back after.
  const openFunding = () => {
    money.setError(null);
    setSheet(null);
    setFunding(true);
  };
  const closeFunding = () => {
    setFunding(false);
    void Promise.resolve(money.refreshAssets()).catch((e: unknown) => money.setError(toFriendlyError(e)));
    setSheet("buy");
  };

  const busy = bulk.state === "running" || money.converting;
  const verbs = basketVerbs([...picked]);

  return (
    <>
      <PickBar
        picked={buyRows.map((r) => ({ id: r.id, symbol: r.symbol }))}
        selectedCount={picked.size}
        heldUsd={heldUsd}
        state={bulk.state}
        done={bulk.done.map((d) => ({ ...d, id: views.find((v) => v.id === d.id)?.name ?? d.id }))}
        verbs={{ buy: t(verbs.buy), sell: t(verbs.sell) }}
        canSell={held.length > 0}
        // On a basket you already own, leaving is the likelier errand — so that's
        // the filled button. On the market it's the other way round.
        primary={held.length === picked.size && picked.size > 0 ? "sell" : "buy"}
        progress={
          bulk.state === "running"
            ? t(running === "sell" ? "bulk.progressSell" : "bulk.progressBuy", {
                n: String(bulk.done.length),
                total: String(running === "sell" ? held.length : picked.size),
              })
            : null
        }
        onBuy={() => setSheet("buy")}
        onSellAll={() => void sell({})}
        onSellAmounts={() => setSheet("sell")}
        onClear={() => {
          onClear();
          bulk.reset();
        }}
      />

      {sheet && (
        <AllocationSheet
          mode={sheet}
          rows={sheet === "buy" ? buyRows : sellRows}
          {...(sheet === "buy" ? { budgetUsd: money.budgetUsd, cashUsd: money.cashUsd, onSwap } : {})}
          busy={busy}
          results={bulk.results}
          payWith={
            sheet === "buy" ? (
              <>
                <div className="flex items-center gap-2 rounded-[10px] border border-ink/10 px-3 py-2.5">
                  <Wallet size={14} strokeWidth={1.5} className="shrink-0 text-ink/40" />
                  <span className="text-[12px] lowercase tracking-wide text-ink/45">{t("alloc.dollars")}</span>
                  <span className="ml-auto text-[13px] tabular-nums text-ink">
                    ${formatUsdAmount(money.cashUsd)}
                  </span>
                </div>
                {money.spareUsd > 0.005 && (
                  <p className="mt-1.5 px-1 text-[11px] leading-snug text-ink/40">
                    {t("alloc.otherCoins", { usd: `$${formatUsdAmount(money.spareUsd)}` })}
                  </p>
                )}
                <button
                  type="button"
                  onClick={openFunding}
                  disabled={busy}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-2.5 text-[13px] lowercase tracking-wide text-ink/70 transition hover:border-ink/40 hover:text-ink disabled:opacity-40"
                >
                  {t("wallet.fund")}
                </button>
              </>
            ) : undefined
          }
          progress={
            busy
              ? money.converting
                ? t("alloc.converting")
                : t(sheet === "sell" ? "bulk.progressSell" : "bulk.progressBuy", {
                    n: String(bulk.done.length),
                    total: String(sheet === "sell" ? sellRows.length : buyRows.length),
                  })
              : null
          }
          error={money.error}
          onConfirm={sheet === "buy" ? buy : sell}
          onClose={() => {
            setSheet(null);
            money.setError(null);
            bulk.reset();
          }}
        />
      )}

      <AnimatePresence>{funding && <FundSheet onClose={closeFunding} />}</AnimatePresence>
    </>
  );
}

/**
 * What to call the two directions for THIS basket. You buy a share and you sell it;
 * you put money into a lending market and take it out. A basket holding both gets
 * the plain words, and each row still says exactly what it is.
 */
function basketVerbs(ids: string[]): { buy: TranslationKey; sell: TranslationKey } {
  const prices = ids.filter((id) => isPriceExposure(id)).length;
  if (prices === ids.length && ids.length > 0) return { buy: "verb.buy", sell: "verb.sell" };
  if (prices === 0) return { buy: "verb.deposit", sell: "verb.withdraw" };
  return { buy: "verb.putIn", sell: "verb.takeOut" };
}
