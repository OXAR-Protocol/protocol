"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";

import { AmountQuickPicks } from "@/components/amount-quick-picks";
import { PayWithPicker } from "@/components/pay-with-picker";
import { FundSheet } from "@/components/fund-sheet";
import { usePaySource } from "@/hooks/use-pay-source";
import { DepositConfirm } from "@/components/deposit-confirm";
import { ExitCostNotice } from "@/components/exit-cost-notice";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import { useNetPreview } from "@/hooks/use-net-preview";
import { useSwapInPreview } from "@/hooks/use-swap-in-preview";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { isPriceExposure } from "@/lib/yield/assets";
import { normalizeDecimalInput, usdcAsset } from "@oxar/sdk";
import { USDC_MINT } from "@/lib/constants";
import { useT, localizeError } from "@/lib/i18n";

interface Props {
  view: ProviderView;
  onDeposited: (usdAmount: number) => void;
  /** Action verb — "Deposit" (default) for yield sources, "Buy" for stocks. */
  verb?: string;
  /** Per-unit USD price (e.g. a share price). When set, a "buy N units" input
   *  appears that auto-fills the pay amount. */
  sharePriceUsd?: number;
  /** Label for one unit in the quantity input, e.g. "SPCXx" / "shares". */
  unitLabel?: string;
}

/**
 * Buying, in dollars.
 *
 * This panel used to ask what to pay with — USDC, SOL, USDT, or a token on another
 * chain — which is the crypto machinery we promise not to show. Someone came to buy
 * a hundred dollars of Apple; which coin settles it is our problem, not theirs.
 *
 * So the amount is always in dollars — one field, one currency, whatever settles it.
 * WHERE those dollars come from is a separate question with an obvious default: the
 * USDC in the wallet. Anything else the wallet holds — a coin, or something already
 * bought — can be picked instead, and the conversion is named before it runs. What
 * we don't do is decide that for someone: a purchase that quietly sells your Apple
 * is not a purchase you agreed to.
 */
export function DepositPanel({ view, onDeposited, verb = "Deposit", sharePriceUsd, unitLabel = "shares" }: Props) {
  const { t } = useT();
  const lower = verb.toLowerCase();
  const { assets: solAssets, loading: solLoading } = useWalletAssets();
  const { depositWith, status, error } = useUniversalDeposit(view.id);
  const busy = status !== "idle";
  const busyLabel = busy ? t(`status.${status}` as "status.working") : null;
  // Amount is entered in the selected currency's units; USD is derived for the
  // (USD-denominated) money path below via the asset's unit price. `null` = the
  // field is untouched, so it shows a ≈ $50 default of the current currency.
  const [amount, setAmount] = useState<string | null>(null);
  // Show the "no surprises" review before the deposit signs.
  const [confirming, setConfirming] = useState(false);
  const [showFund, setShowFund] = useState(false);
  // Paybis is back to insiders while the Ukrainian on-ramp is unsolved —
  // everyone else gets the built-in card and nothing to choose between.
  // USD to buy via Apple Pay when the wallet is empty — there's no pay-asset to
  // size the amount from, so the user enters it directly. Pre-filled, editable.

  const assetsLoading = solLoading;
  // Paying dollars into a dollar product needs no swap at all.
  const isDirect = view.assetMint === USDC_MINT;
  // What this is paid with. Dollars unless the user says otherwise — a coin they
  // hold, or something they already bought. Whatever they pick, the figure below is
  // in DOLLARS, because that is what the field asks for. Everything except the thing
  // being bought: paying for Apple with Apple is two swaps back to where you started.
  const pay = usePaySource({ viewIds: [view.id], mints: [view.heldMint] });
  // The dollars come off the chain (`usePaySource` → `useUsdcBalance`), not out of the
  // priced asset list: that list can lose USDC when the price feed doesn't answer, and
  // this screen then offered no dollars to pay with while the wallet held plenty.
  const dollarsFree = pay.dollars.usd;
  const dollarsAsset = useMemo(
    () =>
      solAssets.find((a) => a.mint === USDC_MINT) ??
      (dollarsFree > 0 ? usdcAsset(USDC_MINT, dollarsFree) : null),
    [solAssets, dollarsFree],
  );
  // Paying with a holding means the dollars don't exist yet — the review and the
  // preview still need something to describe, and one dollar is one dollar.
  const payAsset =
    pay.source?.kind === "coin"
      ? pay.source.asset
      : dollarsAsset ?? (pay.source ? usdcAsset(USDC_MINT, pay.source.usd) : null);
  const free = pay.source ? pay.source.usd : dollarsFree;
  // Empty only when there is nothing to pay with AT ALL — dollars, coins, holdings.
  const emptyWallet = !assetsLoading && !pay.loading && free <= 0 && pay.options.length === 0;


  // Dollars in, dollars out: no unit price to convert through any more.
  const effectiveAmount = amount ?? "";
  const usdAmount = parseFloat(effectiveAmount) || 0;
  const short = usdAmount > free ? usdAmount - free : 0;

  // Quantity entry: type N units (e.g. shares) → fill the pay amount with the
  // USD-equivalent (units × unit price), expressed in the pay-asset's currency.
  const canQuantity = !!sharePriceUsd && sharePriceUsd > 0;
  const sharesValue = canQuantity ? usdAmount / sharePriceUsd! : 0;
  const onSharesChange = (s: string) => {
    const n = parseFloat(s);
    setAmount(n > 0 ? String(Number((n * sharePriceUsd!).toFixed(2))) : "");
  };

  // Selling a holding to pay is part of THIS purchase — the panel stays busy through
  // it, or the confirm button invites a second attempt while the first is still going.
  const working = busy || pay.busy;

  const preview = useNetPreview({
    payAsset,
    usdAmount,
    productMint: view.assetMint,
    productDecimals: view.decimals,
  });

  // Swap-and-hold (Ondo / stocks): the deposit swaps USDC → the held asset, so show
  // what you'll actually hold + the swap cost up front (no surprise minus after).
  const swapIn = useSwapInPreview({
    heldMint: view.heldMint,
    heldDecimals: view.heldDecimals,
    usdAmount,
    enabled: !!view.heldMint && !!payAsset,
  });
  // Price-exposure only (stocks/gold) — yield sources don't carry this framing.
  const price = isPriceExposure(view.id);


  const handleDeposit = async () => {
    if (usdAmount <= 0) return;
    try {
      // Paying with something you already own: sell exactly this much of it first,
      // then buy with the dollars that arrived. A coin needs none of this — the
      // deposit swaps it on the way in, one transaction instead of two.
      let asset = payAsset;
      let amount = usdAmount;
      if (pay.source?.kind === "position") {
        const landed = await pay.raise(usdAmount);
        amount = Math.min(usdAmount, landed);
        // A dollar is a dollar: the wallet may not have HAD any before the sale, so
        // the asset it pays with is described from what the sale produced.
        asset = usdcAsset(USDC_MINT, landed);
      }
      if (!asset || amount <= 0) return;
      const depositedBase = await depositWith(asset, amount);
      setConfirming(false); // leave the review so the panel resets behind the success overlay
      onDeposited(Number(depositedBase) / 10 ** view.decimals);
    } catch {
      // surfaced via `error` — stay on the review so the user can retry
    }
  };

  // USD the card buy will charge — always what the user typed. With crypto in the
  // wallet that's the pay amount; with an empty wallet it's the field above. Nothing
  // typed means nothing charged, which disables the button rather than assuming.

  if (confirming && payAsset) {
    return (
      <div className="p-4 rounded-tight border border-ink/10 bg-paper">
        <DepositConfirm
          verb={verb}
          usdAmount={usdAmount}
          payAsset={payAsset}
          view={view}
          isDirect={isDirect}
          preview={preview}
          swapIn={swapIn}
          busy={working}
          label={busyLabel ?? (pay.busy ? t("pay.selling") : null)}
          error={error}
          onConfirm={handleDeposit}
          onBack={() => setConfirming(false)}
        />
      </div>
    );
  }


  return (
    <div className="p-4 rounded-tight border border-ink/10 bg-paper">
      {/* The payment method, ahead of the amount — it's the thing the amount is
          taken FROM, and it used to be an unchangeable label saying "dollars". */}
      {!emptyWallet && (
        <div className="mb-3">
          <PayWithPicker
            value={pay.source}
            options={pay.options}
            dollarsUsd={dollarsFree}
            disabled={working}
            onChange={pay.setSource}
          />
        </div>
      )}

      {/* One currency, so the field says the amount and nothing else. */}
      <div className="mt-2">
        {assetsLoading ? (
          <p className="text-xs text-ink/40">{t("deposit.loadingAssets")}</p>
        ) : emptyWallet ? (
          <div className="rounded-card border border-ink/10 p-4 text-center">
            <p className="text-[13px] leading-snug text-ink/55">{t("deposit.emptyWallet")}</p>
            <button
              type="button"
              onClick={() => setShowFund(true)}
              className="mt-3 w-full rounded-full bg-ink px-4 py-2.5 text-[13px] lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
            >
              {t("wallet.fund")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-card border border-ink/10 px-4 py-3 transition-colors focus-within:border-ink/30">
              <span className="text-[22px] text-ink/35">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={effectiveAmount}
                onChange={(e) => setAmount(normalizeDecimalInput(e.target.value))}
                placeholder="0.00"
                className="w-full bg-transparent text-[22px] tabular-nums text-ink outline-none placeholder:text-ink/25"
              />
            </div>

            <AmountQuickPicks
              available={free}
              onPick={(v) => setAmount(v.toFixed(2))}
              onTopUp={() => setShowFund(true)}
              disabled={busy}
            />
          </>
        )}

        {/* Quantity shortcut — type how many units to buy; the pay amount fills in. */}
        {canQuantity && payAsset && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-control border border-ink/10 px-3 py-2">
            <span className="text-[11px] lowercase tracking-wide text-ink/40">{lower}</span>
            <input
              type="text"
              inputMode="decimal"
              value={sharesValue ? Number(sharesValue.toPrecision(4)) : ""}
              onChange={(e) => onSharesChange(normalizeDecimalInput(e.target.value))}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-right text-[15px] text-ink outline-none placeholder:text-ink/25"
            />
            <span className="shrink-0 text-[12px] text-ink/45">{unitLabel}</span>
          </div>
        )}


      </div>

      {/* Net received */}
      {payAsset && usdAmount > 0 && (
        <p className="mt-2 text-[11px] text-ink/45">
          {view.heldMint ? (
            // Swap-and-hold: show what you'll actually hold + the swap cost.
            swapIn.quoting
              ? t("deposit.quoting")
              : swapIn.valueUsd !== null
                ? t("deposit.youllHold", { value: `$${swapIn.valueUsd.toFixed(2)}` }) +
                  (swapIn.spreadUsd && swapIn.spreadUsd > 0
                    ? ` · ${t("deposit.swapCost", { value: `$${swapIn.spreadUsd < 0.01 ? swapIn.spreadUsd.toFixed(4) : swapIn.spreadUsd.toFixed(2)}` })}`
                    : "")
                : t("deposit.cantQuote")
          ) : isDirect ? (
            t("deposit.youllDo", { verb: lower, value: `$${usdAmount.toFixed(2)} ${view.assetSymbol}` })
          ) : preview.quoting ? (
            t("deposit.quoting")
          ) : preview.netUsdc !== null ? (
            t("deposit.youllDo", { verb: lower, value: `~$${preview.netUsdc.toFixed(2)} ${view.assetSymbol}` }) +
            t("deposit.afterSwap")
          ) : (
            t("deposit.cantQuote")
          )}
        </p>
      )}

      {/* What leaving would cost, quoted live — stocks/gold only, once an amount
          is entered. Not a gate: the sell itself is never blocked on this. */}
      {price && (
        <ExitCostNotice
          heldMint={view.heldMint}
          heldDecimals={view.heldDecimals}
          usdAmount={usdAmount}
          priceUsd={sharePriceUsd}
        />
      )}

      {/* Crypto deposit — hidden on an empty wallet (nothing to pay with). */}
      {!emptyWallet && (
        <>
          <button
            onClick={() => setConfirming(true)}
            // A card top-up that's still funding/arriving hasn't touched the wallet
            // yet — no reason to freeze this unrelated path. Once it's actually
            // buying (signing+sending), the two shouldn't race the same wallet.
            disabled={working || !payAsset || usdAmount <= 0 || short > 0}
            className="mt-3 w-full px-4 py-3 rounded-full bg-ink text-paper text-[14px] font-medium lowercase tracking-wide hover:bg-ink/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
          >
            {verb}
          </button>
          {short > 0 ? (
            // Not enough dollars: say how many are missing and offer the way to get
            // them. Quietly swapping something else the wallet holds would be moving
            // money nobody asked to move.
            <button
              type="button"
              onClick={() => setShowFund(true)}
              className="mt-2 w-full text-center text-[11px] leading-snug text-ink/50 underline decoration-black/20 underline-offset-2 transition hover:text-ink"
            >
              {t("deposit.short", { value: `$${short.toFixed(2)}` })}
            </button>
          ) : error ? (
            <p className="mt-3 text-xs text-loss text-center">{localizeError(error, t)}</p>
          ) : null}
        </>
      )}

      {/* Money in and money spent are two steps now, not one button that did both.
          Topping up lives in its own sheet (card, crypto, exchange) and this panel
          only spends what is already here. */}
      <AnimatePresence>{showFund && <FundSheet onClose={() => setShowFund(false)} />}</AnimatePresence>
    </div>
  );
}
