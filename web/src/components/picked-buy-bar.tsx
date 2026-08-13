"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Wallet } from "lucide-react";

import { spendableUsd, formatUsdAmount } from "@oxar/sdk";

import { usePickSet } from "@/components/pick-set";
import { PickBar } from "@/components/pick-bar";
import { AllocationSheet } from "@/components/allocation-sheet";
import { FundSheet } from "@/components/fund-sheet";
import { useBulkTrade } from "@/hooks/use-bulk-trade";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { USDC_MINT } from "@/lib/constants";
import { getProvider, toFriendlyError, positionTitle, unitLabelOf } from "@/lib/yield";
import { isPriceExposure } from "@/lib/yield/assets";
import { useStockPrices } from "@/hooks/use-stock-prices";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { useT } from "@/lib/i18n";

/**
 * The bar and the sheet for everything picked on a page — yield sources, stocks and
 * gold alike. Mounted once, inside the set, so the sections can't each grow their own.
 *
 * The basket is paid for in dollars, like everything else in the app. It used to ask
 * which coin — and on which chain — should settle a basket of purchases, which is a
 * question about our plumbing, not about what the person is buying. The budget is now
 * simply the dollars in the wallet; other money becomes dollars in the top-up sheet.
 */
export function PickedBuyBar({ views }: { views: readonly ProviderView[] }) {
  const { t } = useT();
  const pickSet = usePickSet();
  const bulk = useBulkTrade();
  const { assets, refresh: refreshAssets } = useWalletAssets();
  const [allocating, setAllocating] = useState(false);
  const [funding, setFunding] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);
  // Prices for the picked price-exposure assets, so a row can be typed in shares.
  const pickedMints = views
    .filter((v) => pickSet?.picked.has(v.id) && isPriceExposure(v.id) && v.heldMint)
    .map((v) => v.heldMint as string);
  const { prices } = useStockPrices(pickedMints);
  if (!pickSet?.enabled) return null;

  const rows = [...pickSet.picked]
    .map((id) => {
      const p = getProvider(id);
      if (!p) return null;
      // Siblings of a collapsed source, so the market chosen for you is changeable
      // here rather than only back on the card it came from.
      // Same product, different settlement currency — Jupiter Lend's USDC beside its
      // USDT. NOT "same section": every xStock shares group "xstocks", so keying on
      // the group alone offered Amazon as an alternative to Microsoft, 27 chips deep,
      // each labelled with the currency they are all bought with. Members of a real
      // pair share one NAME and differ only in what you pay with.
      const alternatives = views
        .filter(
          (o) =>
            !!p.group &&
            o.group === p.group &&
            o.name === p.name &&
            o.id !== p.id &&
            !pickSet.picked.has(o.id),
        )
        .map((o) => ({ id: o.id, label: unitLabelOf(o), apy: o.apy }));
      // Buying is priced by the market, so the unit price has to be asked for —
      // unlike selling, where the position already knows what it's worth.
      const price = p.heldMint ? prices[p.heldMint]?.price : undefined;
      const unit = isPriceExposure(p.id) && price ? { unitPriceUsd: price, unitLabel: unitLabelOf(p) } : {};
      return { id, name: positionTitle(p), symbol: p.assetSymbol, alternatives, ...unit };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  // One currency, so one balance: the dollars already in the wallet.
  const payAsset = assets.find((a) => a.chain === "solana" && a.mint === USDC_MINT) ?? null;
  const budget = payAsset ? spendableUsd(payAsset) : 0;

  const buy = async (amounts: Record<string, number>) => {
    if (!payAsset) return;
    setFundError(null);

    const outcomes = await bulk.run(
      rows
        .filter((r) => (amounts[r.id] ?? 0) > 0)
        .map((r) => ({ kind: "buy" as const, id: r.id, amountUsd: amounts[r.id]! })),
    );
    if (outcomes.every((o) => o.ok)) {
      setAllocating(false);
      pickSet.clear();
      // Clear the run too: otherwise the next selection appears alongside the last
      // run's outcomes, which have nothing to do with it.
      bulk.reset();
    }
  };

  // Money in is a SIDE errand — it raises the budget, it doesn't buy anything. It also
  // takes over the screen (a card provider's window, an address to send to), so the
  // basket steps aside for it and comes back when it's done.
  const openFunding = () => {
    setFundError(null);
    setAllocating(false);
    setFunding(true);
  };
  const closeFunding = () => {
    setFunding(false);
    void refreshAssets().catch((e: unknown) => setFundError(toFriendlyError(e)));
    setAllocating(true);
  };

  const busy = bulk.state === "running";

  return (
    <>
      <PickBar
        mode="buy"
        picked={rows.map((r) => ({ id: r.id, symbol: r.symbol }))}
        selectedCount={rows.length}
        totalUsd={budget}
        state={bulk.state}
        done={bulk.done}
        onSell={() => setAllocating(true)}
        onClear={() => {
          pickSet.clear();
          bulk.reset();
        }}
      />
      {allocating && (
        <AllocationSheet
          onSwap={(from, to) => pickSet.swap(from, to)}
          mode="buy"
          rows={rows}
          budgetUsd={budget}
          busy={busy}
          results={bulk.results}
          payWith={
            <>
              <div className="flex items-center gap-2 rounded-[10px] border border-black/10 px-3 py-2.5">
                <Wallet size={14} strokeWidth={1.5} className="shrink-0 text-black/40" />
                <span className="text-[12px] lowercase tracking-wide text-black/45">
                  {t("alloc.dollars")}
                </span>
                <span className="ml-auto text-[13px] tabular-nums text-black">
                  ${formatUsdAmount(budget)}
                </span>
              </div>
              <button
                type="button"
                onClick={openFunding}
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-[13px] lowercase tracking-wide text-black/70 transition hover:border-black/40 hover:text-black disabled:opacity-40"
              >
                {t("wallet.fund")}
              </button>
            </>
          }
          progress={
            bulk.state === "running"
              ? t("bulk.progress", { n: String(bulk.done.length), total: String(rows.length) })
              : null
          }
          error={fundError}
          onConfirm={buy}
          onClose={() => {
            setAllocating(false);
            setFundError(null);
            bulk.reset();
          }}
        />
      )}
      <AnimatePresence>{funding && <FundSheet onClose={closeFunding} />}</AnimatePresence>
    </>
  );
}
