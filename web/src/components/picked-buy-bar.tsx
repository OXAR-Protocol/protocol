"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";

import { assetUid, spendableBase, rescaleAllocations, type WalletAsset } from "@oxar/sdk";

import { usePickSet } from "@/components/pick-set";
import { PickBar } from "@/components/pick-bar";
import { AllocationSheet } from "@/components/allocation-sheet";
import { PayWithField } from "@/components/pay-with-field";
import { useBulkTrade } from "@/hooks/use-bulk-trade";
import { useBulkFunding } from "@/hooks/use-bulk-funding";
import { useCardTopUp } from "@/hooks/use-card-topup";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useEvmAssets } from "@/hooks/use-evm-assets";
import { usePrivy } from "@privy-io/react-auth";
import { useBridgeDeposit } from "@/hooks/use-bridge-deposit";
import { USDC_MINT } from "@/lib/constants";

/** The bridge needs a provider only to read the destination mint; every basket
 *  settles in the same dollar asset, so any USDC source answers that. */
const USDC_PROVIDER_ID = "jupiter-lend-usdc";
import { getProvider, toFriendlyError, positionTitle } from "@/lib/yield";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { useT } from "@/lib/i18n";

/** What the card form opens on — the on-ramps won't sell less than this. */
const CARD_MINIMUM_USD = 20;

/** USD the asset can actually put towards a purchase, net of any fee reserve. */
function spendableUsd(a: WalletAsset): number {
  if (a.uiAmount <= 0) return 0;
  const price = a.usdValue / a.uiAmount;
  return (Number(spendableBase(a)) / 10 ** a.decimals) * price;
}

/**
 * The bar and the sheet for everything picked on a page — yield sources, stocks and
 * gold alike. Mounted once, inside the set, so the sections can't each grow their own.
 *
 * The basket can be paid for with anything on Solana, not only USDC. Because the
 * purchases settle in USDC, a different pay-asset is converted ONCE for the whole
 * basket rather than per asset: one prompt, one slippage hit, not N of each.
 */
export function PickedBuyBar({ views }: { views: readonly ProviderView[] }) {
  const { t } = useT();
  const pickSet = usePickSet();
  const bulk = useBulkTrade();
  const { fundUsdc, converting } = useBulkFunding();
  const { topUp, cancel: cancelTopUp, busy: toppingUp } = useCardTopUp();
  const { assets, refresh: refreshAssets } = useWalletAssets();
  const { assets: evmAssets, evmAddress } = useEvmAssets();
  const { linkWallet, unlinkWallet } = usePrivy();
  // Any provider id works here — the bridge only needs the destination mint, and
  // every basket settles in the same one.
  const bridge = useBridgeDeposit(USDC_PROVIDER_ID);
  const [allocating, setAllocating] = useState(false);
  const [payUid, setPayUid] = useState<string | null>(null);
  const [fundError, setFundError] = useState<string | null>(null);
  if (!pickSet?.enabled) return null;

  const rows = [...pickSet.picked]
    .map((id) => {
      const p = getProvider(id);
      if (!p) return null;
      // Siblings of a collapsed source, so the market chosen for you is changeable
      // here rather than only back on the card it came from.
      const alternatives = views
        .filter((o) => !!p.group && o.group === p.group && o.id !== p.id && !pickSet.picked.has(o.id))
        .map((o) => ({ id: o.id, label: o.assetSymbol, apy: o.apy }));
      return { id, name: positionTitle(p), symbol: p.assetSymbol, alternatives };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  // Solana first (instant or a quick swap), then the other chains. A cross-chain
  // basket doesn't complete here: it bridges now and buys when the money lands.
  const payable = [...assets, ...evmAssets].filter((a) => a.usdValue > 0);
  const payAsset =
    payable.find((a) => assetUid(a) === payUid) ??
    payable.find((a) => a.mint === USDC_MINT) ??
    payable[0] ??
    null;
  const budget = payAsset ? spendableUsd(payAsset) : 0;

  const buy = async (amounts: Record<string, number>) => {
    if (!payAsset) return;
    setFundError(null);

    // Paying from another chain: send the money once and hand the watcher the whole
    // plan. It buys on arrival, minutes later, shrinking the plan as each leg lands —
    // so nothing here waits, and nothing is bought twice if the page is closed.
    if (payAsset.chain === "ethereum") {
      const total = Object.values(amounts).reduce((sum, v) => sum + v, 0);
      const plan = Object.entries(amounts)
        .filter(([, v]) => v > 0)
        .map(([providerId, amountUsd]) => ({ providerId, amountUsd }));
      if (!plan.length) return;
      try {
        await bridge.bridgeAndDeposit(payAsset, total, plan);
        setAllocating(false);
        pickSet.clear();
        bulk.reset();
      } catch (e) {
        console.error("Bridging the basket failed:", e);
        setFundError(toFriendlyError(e));
      }
      return;
    }

    let spendable = amounts;
    if (payAsset.mint !== USDC_MINT) {
      const asked = Object.values(amounts).reduce((sum, v) => sum + v, 0);
      let realized: number;
      try {
        realized = await fundUsdc(payAsset, asked);
      } catch (e) {
        console.error("Funding the basket failed:", e);
        setFundError(toFriendlyError(e));
        return;
      }
      // The conversion lands at or below what was quoted. Spending the original
      // amounts against the smaller balance would starve the LAST purchase.
      spendable = rescaleAllocations(amounts, realized);
    }

    const outcomes = await bulk.run(
      rows
        .filter((r) => (spendable[r.id] ?? 0) > 0)
        .map((r) => ({ kind: "buy" as const, id: r.id, amountUsd: spendable[r.id]! })),
    );
    if (outcomes.every((o) => o.ok)) {
      setAllocating(false);
      pickSet.clear();
      // Clear the run too: otherwise the next selection appears alongside the last
      // run's outcomes, which have nothing to do with it.
      bulk.reset();
    }
  };

  // Card money is a TOP-UP, not a payment method: the on-ramp delivers dollars to the
  // wallet minutes later, so it can't be a leg of a run that signs transactions now.
  // It raises the budget, then the user splits it and buys — same as any other balance.
  const addWithCard = async () => {
    setFundError(null);
    try {
      await topUp(CARD_MINIMUM_USD);
      await refreshAssets();
      // Back to the default choice, which prefers USDC — the money just added.
      setPayUid(null);
    } catch (e) {
      console.error("Card top-up failed:", e);
      setFundError(toFriendlyError(e));
    }
  };

  // A card top-up is a SIDE errand — it adds to the budget, it doesn't buy anything.
  // Including it here froze every input behind a spinner with no way out, which is
  // exactly what an abandoned provider window looked like.
  const busy = bulk.state === "running" || converting || bridge.status !== "idle";

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
              {payAsset && (
                <PayWithField
                  assets={payable}
                  activeUid={assetUid(payAsset)}
                  onSelectUid={setPayUid}
                  // The amounts are set per row below, so the field is a CHOICE of
                  // currency, not a second place to type a number.
                  amount=""
                  onAmountChange={() => {}}
                  usdAmount={budget}
                  productMint={USDC_MINT}
                  readOnlyAmount
                />
              )}
              {/* Without this the picker only ever lists what's ALREADY connected, so
                  "pay from another chain" was invisible to anyone who hadn't linked a
                  wallet — the single-asset panel offers the same link, and the basket
                  sheet was the only place missing it. */}
              {!evmAddress ? (
                <button
                  type="button"
                  onClick={() => linkWallet()}
                  className="mt-2 text-[11px] lowercase tracking-wide text-black/40 underline decoration-black/20 underline-offset-2 transition hover:text-black/70"
                >
                  {t("deposit.payFromAnotherChain")}
                </button>
              ) : (
                <div className="mt-2 flex items-center gap-2 text-[10px] lowercase tracking-wide text-black/45">
                  <span>
                    EVM {evmAddress.slice(0, 6)}…{evmAddress.slice(-4)}
                  </span>
                  <button type="button" onClick={() => unlinkWallet(evmAddress)} className="underline transition hover:text-black/70">
                    {t("deposit.disconnect")}
                  </button>
                </div>
              )}

              {payAsset?.chain === "ethereum" && (
                <p className="mt-2 text-[11px] leading-snug text-black/45">
                  {t("alloc.bridgeNote")}
                </p>
              )}
              <button
                type="button"
                onClick={toppingUp ? cancelTopUp : addWithCard}
                disabled={busy}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-[13px] lowercase tracking-wide text-black/70 transition hover:border-black/40 hover:text-black disabled:opacity-40"
              >
                {toppingUp ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CreditCard size={14} strokeWidth={1.5} />
                )}
                {/* While waiting, the same button stops waiting. A spinner with no
                    way out is how an abandoned card window looked. */}
                {toppingUp ? t("alloc.stopWaiting") : t("alloc.addWithCard")}
              </button>
            </>
          }
          progress={
            bridge.status !== "idle"
              ? t("bulk.bridging")
              : converting
              ? t("bulk.converting")
              : bulk.state === "running"
                ? t("bulk.progress", { n: String(bulk.done.length), total: String(rows.length) })
                : null
          }
          error={fundError ?? bridge.error}
          onConfirm={buy}
          onClose={() => {
            setAllocating(false);
            setFundError(null);
            bulk.reset();
          }}
        />
      )}
    </>
  );
}
