"use client";

import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence } from "framer-motion";

import { AmountQuickPicks } from "@/components/amount-quick-picks";
import { FundSheet } from "@/components/fund-sheet";
import { koraEnabled } from "@/lib/gas/kora";
import { DepositConfirm } from "@/components/deposit-confirm";
import { ExitCostNotice } from "@/components/exit-cost-notice";
import { useSolanaContext } from "@/providers/solana-provider";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useDeposit } from "@/hooks/use-deposit";
import { useNetPreview } from "@/hooks/use-net-preview";
import { useSwapInPreview } from "@/hooks/use-swap-in-preview";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { isPriceExposure } from "@/lib/yield/assets";
import { normalizeDecimalInput, spendableBase } from "@oxar/sdk";
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
 * So the only currency here is the dollar, and the only balance that matters is the
 * USDC already in the wallet. Other coins haven't disappeared: they stopped being a
 * payment method and became what they are — other money, turned into dollars in the
 * top-up sheet, which is also where paying from another chain now lives.
 */
export function DepositPanel({ view, onDeposited, verb = "Deposit", sharePriceUsd, unitLabel = "shares" }: Props) {
  const { t } = useT();
  const lower = verb.toLowerCase();
  const { assets: solAssets, loading: solLoading } = useWalletAssets();
  const { depositWith, busy, status, error } = useDeposit(view.id);
  const busyLabel = busy ? t(`status.${status}` as "status.working") : null;
  // Apple Pay / card path — funds fresh USDC via Privy's on-ramp, then buys.
  // Works with no crypto in the wallet (the whole point), so it's independent
  // of the pay-asset picker below.
  // Card buy funds native SOL (Privy on-ramp), keeps a gas buffer, swaps the rest
  // into the asset. The user's own SOL pays gas for any tx — no relayer/sponsorship.
  const { isExternal } = useSolanaContext();

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
  // The wallet's dollars. Everything else it holds is spendable only after being
  // turned into these, which is a separate, explicit act — money never moves
  // sideways on its own.
  const payAsset = useMemo(
    () => solAssets.find((a) => a.chain === "solana" && a.mint === USDC_MINT) ?? null,
    [solAssets],
  );
  const free = payAsset
    ? Number(spendableBase(payAsset, !koraEnabled() || isExternal)) / 10 ** payAsset.decimals
    : 0;
  const emptyWallet = !assetsLoading && free <= 0;


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
    if (!payAsset || usdAmount <= 0) return;
    try {
      const depositedBase = await depositWith(payAsset, usdAmount);
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
      <div className="p-4 rounded-[6px] border border-black/10 bg-white">
        <DepositConfirm
          verb={verb}
          usdAmount={usdAmount}
          payAsset={payAsset}
          view={view}
          isDirect={isDirect}
          preview={preview}
          swapIn={swapIn}
          busy={busy}
          label={busyLabel}
          error={error}
          onConfirm={handleDeposit}
          onBack={() => setConfirming(false)}
        />
      </div>
    );
  }


  return (
    <div className="p-4 rounded-[6px] border border-black/10 bg-white">
      {/* Label the field as the PAYMENT method — without this the prominent "USDC"
          reads as if the user is buying USDC, not paying with it for the asset. */}
      <p className="text-[10px] lowercase tracking-wide text-black/40 mb-2">{t("deposit.payWith")}</p>

      {/* One currency, so the field says the amount and nothing else. */}
      <div className="mt-2">
        {assetsLoading ? (
          <p className="text-xs text-black/40">{t("deposit.loadingAssets")}</p>
        ) : emptyWallet ? (
          <div className="rounded-[12px] border border-black/10 p-4 text-center">
            <p className="text-[13px] leading-snug text-black/55">{t("deposit.emptyWallet")}</p>
            <button
              type="button"
              onClick={() => setShowFund(true)}
              className="mt-3 w-full rounded-full bg-black px-4 py-2.5 text-[13px] lowercase tracking-wide text-white transition hover:bg-black/85"
            >
              {t("wallet.fund")}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-[12px] border border-black/10 px-4 py-3 transition-colors focus-within:border-black/30">
              <span className="text-[22px] text-black/35">$</span>
              <input
                type="text"
                inputMode="decimal"
                value={effectiveAmount}
                onChange={(e) => setAmount(normalizeDecimalInput(e.target.value))}
                placeholder="0.00"
                className="w-full bg-transparent text-[22px] tabular-nums text-black outline-none placeholder:text-black/25"
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
          <div className="mt-2 flex items-center justify-between gap-2 rounded-[10px] border border-black/10 px-3 py-2">
            <span className="text-[11px] lowercase tracking-wide text-black/40">{lower}</span>
            <input
              type="text"
              inputMode="decimal"
              value={sharesValue ? Number(sharesValue.toPrecision(4)) : ""}
              onChange={(e) => onSharesChange(normalizeDecimalInput(e.target.value))}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-right text-[15px] text-black outline-none placeholder:text-black/25"
            />
            <span className="shrink-0 text-[12px] text-black/45">{unitLabel}</span>
          </div>
        )}


      </div>

      {/* Net received */}
      {payAsset && usdAmount > 0 && (
        <p className="mt-2 text-[11px] text-black/45">
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
            disabled={busy || !payAsset || usdAmount <= 0 || short > 0}
            className="mt-3 w-full px-4 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
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
              className="mt-2 w-full text-center text-[11px] leading-snug text-black/50 underline decoration-black/20 underline-offset-2 transition hover:text-black"
            >
              {t("deposit.short", { value: `$${short.toFixed(2)}` })}
            </button>
          ) : error ? (
            <p className="mt-3 text-xs text-red-400 text-center">{localizeError(error, t)}</p>
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
