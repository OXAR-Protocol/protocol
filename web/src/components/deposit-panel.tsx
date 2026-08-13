"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { AnimatePresence } from "framer-motion";
import { CreditCard } from "lucide-react";

import { PayWithField } from "@/components/pay-with-field";
import { TopUpSheet, TOP_UP_FEATURE } from "@/components/top-up-sheet";
import { CardRouteSheet, type CardRoute } from "@/components/card-route-sheet";
import { AmountQuickPicks } from "@/components/amount-quick-picks";
import { FundSheet } from "@/components/fund-sheet";
import { useFeature } from "@/hooks/use-features";
import { koraEnabled } from "@/lib/gas/kora";
import { DepositConfirm } from "@/components/deposit-confirm";
import { ExitCostNotice } from "@/components/exit-cost-notice";
import { useSolanaContext } from "@/providers/solana-provider";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useEvmAssets } from "@/hooks/use-evm-assets";
import { useDeposit } from "@/hooks/use-deposit";
import { useFundAndBuy } from "@/hooks/use-fund-and-buy";
import { useNetPreview } from "@/hooks/use-net-preview";
import { useSwapInPreview } from "@/hooks/use-swap-in-preview";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { isPriceExposure } from "@/lib/yield/assets";
import { assetUid, checkOriginGas, normalizeDecimalInput, spendableBase } from "@oxar/sdk";
import { USDC_MINT } from "@/lib/constants";
import { useT, localizeError } from "@/lib/i18n";

// On-ramp minimum (MoonPay/Transak floor). There is no default amount: the card
// charges exactly what the user typed, and below the floor the button is disabled.
// A default meant a button that would charge $50 nobody asked for.
const APPLE_PAY_MIN_USD = 20;
// Cross-chain (bridge) minimum: below this the bridge fee eats the amount and the
// route often can't quote at all. Same-chain Solana pays have NO minimum.
const BRIDGE_MIN_USD = 5;

interface Props {
  view: ProviderView;
  /** `pending` = a cross-chain buy that's still bridging (credited in background). */
  onDeposited: (usdAmount: number, pending?: boolean) => void;
  /** Action verb — "Deposit" (default) for yield sources, "Buy" for stocks. */
  verb?: string;
  /** Per-unit USD price (e.g. a share price). When set, a "buy N units" input
   *  appears that auto-fills the pay amount. */
  sharePriceUsd?: number;
  /** Label for one unit in the quantity input, e.g. "SPCXx" / "shares". */
  unitLabel?: string;
}

/** Deposit with any asset on any chain: pick a pay-asset, enter an amount in that
 *  currency, see the net USDC. The money path stays USD-denominated underneath. */
export function DepositPanel({ view, onDeposited, verb = "Deposit", sharePriceUsd, unitLabel = "shares" }: Props) {
  const { t } = useT();
  const lower = verb.toLowerCase();
  const { linkWallet, unlinkWallet } = usePrivy();
  const { assets: solAssets, loading: solLoading } = useWalletAssets();
  const { assets: evmAssets, evmAddress, loading: evmLoading } = useEvmAssets();
  const { depositWith, busy, status, failedAt, error } = useDeposit(view.id);
  const busyLabel = busy ? t(`status.${status}` as "status.working") : null;
  // Apple Pay / card path — funds fresh USDC via Privy's on-ramp, then buys.
  // Works with no crypto in the wallet (the whole point), so it's independent
  // of the pay-asset picker below.
  // Card buy funds native SOL (Privy on-ramp), keeps a gas buffer, swaps the rest
  // into the asset. The user's own SOL pays gas for any tx — no relayer/sponsorship.
  const applePay = useFundAndBuy(view.id);
  const { isExternal } = useSolanaContext();
  // The card on-ramp widget black-screens ONLY inside a mobile wallet's in-app
  // browser (external wallet + mobile). It's fine for embedded wallets anywhere and
  // for external wallets on desktop (a normal browser tab), so only hide it there.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);
  const canUseCard = !(isExternal && isMobile);

  // Amount is entered in the selected currency's units; USD is derived for the
  // (USD-denominated) money path below via the asset's unit price. `null` = the
  // field is untouched, so it shows a ≈ $50 default of the current currency.
  const [amount, setAmount] = useState<string | null>(null);
  // Selection is by asset UID, not mint — native EVM coins share one mint across
  // networks, so keying by mint would pick the wrong-network ETH to bridge.
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  // Show the "no surprises" review before the deposit signs.
  const [confirming, setConfirming] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showFund, setShowFund] = useState(false);
  const [showRoutes, setShowRoutes] = useState(false);
  // Paybis is back to insiders while the Ukrainian on-ramp is unsolved —
  // everyone else gets the built-in card and nothing to choose between.
  const paybisTopUp = useFeature(TOP_UP_FEATURE);
  // USD to buy via Apple Pay when the wallet is empty — there's no pay-asset to
  // size the amount from, so the user enters it directly. Pre-filled, editable.
  const [buyUsdInput, setBuyUsdInput] = useState("");

  // Solana first (instant/swap), then EVM (bridge).
  const assets = useMemo(() => [...solAssets, ...evmAssets], [solAssets, evmAssets]);
  const assetsLoading = solLoading || evmLoading;
  // No crypto to pay with (fresh email wallet) — Apple Pay is the only route.
  const emptyWallet = !assetsLoading && assets.length === 0;

  // Default: the product's own asset if held, else the largest Solana holding, else first.
  const defaultUid = useMemo(() => {
    if (assets.length === 0) return null;
    const pick =
      // Hold the product's own asset already? pay with it (instant, no swap).
      assets.find((a) => a.chain === "solana" && a.mint === view.assetMint) ??
      // Else default to USDC — the dollar asset, clean sponsored path, no SOL wrap.
      assets.find((a) => a.chain === "solana" && a.mint === USDC_MINT) ??
      solAssets[0] ??
      assets[0];
    return assetUid(pick);
  }, [assets, solAssets, view.assetMint]);

  const activeUid = selectedUid ?? defaultUid;
  const payAsset = assets.find((a) => assetUid(a) === activeUid) ?? null;
  const isDirect = payAsset?.chain === "solana" && payAsset.mint === view.assetMint;

  const unitPrice = payAsset && payAsset.uiAmount > 0 ? payAsset.usdValue / payAsset.uiAmount : 0;
  // Start empty (0) — the user types how much; nothing is pre-filled, so the
  // buy/deposit button stays disabled until they enter an amount.
  const effectiveAmount = amount ?? "";
  const usdAmount = (parseFloat(effectiveAmount) || 0) * unitPrice;

  // Quantity entry: type N units (e.g. shares) → fill the pay amount with the
  // USD-equivalent (units × unit price), expressed in the pay-asset's currency.
  const canQuantity = !!sharePriceUsd && sharePriceUsd > 0 && unitPrice > 0;
  const sharesValue = canQuantity ? usdAmount / sharePriceUsd! : 0;
  const onSharesChange = (s: string) => {
    const n = parseFloat(s);
    setAmount(n > 0 ? String(Number(((n * sharePriceUsd!) / unitPrice).toPrecision(6))) : "");
  };

  const preview = useNetPreview({
    payAsset,
    usdAmount,
    productMint: view.assetMint,
    productDecimals: view.decimals,
    evmAddress,
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
      // EVM pay-assets bridge in the background — the deposit isn't done yet.
      onDeposited(Number(depositedBase) / 10 ** view.decimals, payAsset.chain === "ethereum");
    } catch {
      // surfaced via `error` — stay on the review so the user can retry
    }
  };

  // USD the card buy will charge — always what the user typed. With crypto in the
  // wallet that's the pay amount; with an empty wallet it's the field above. Nothing
  // typed means nothing charged, which disables the button rather than assuming.
  const applePayUsd = emptyWallet
    ? Math.max(0, parseFloat(normalizeDecimalInput(buyUsdInput)) || 0)
    : usdAmount;
  // Small tolerance: USDC isn't priced at exactly $1 (Jupiter ~0.9997), so a typed
  // "$20" converts to ~$19.99 and would wrongly trip the $20 minimum at the boundary.
  const applePayBelowMin = applePayUsd < APPLE_PAY_MIN_USD - 0.5;
  // Bridge route = paying with an EVM (cross-chain) asset. Enforce a floor there
  // ONLY — a same-chain Solana pay (USDC / SPL swap) can be any amount. Small
  // tolerance: entering exactly "$5" round-trips through token units (5/price →
  // 8-sig-fig round → ×price) to ~$4.9999, which would wrongly trip the boundary.
  const bridgeBelowMin =
    payAsset?.chain === "ethereum" && usdAmount > 0 && usdAmount < BRIDGE_MIN_USD - 0.01;
  const handleApplePay = async () => {
    try {
      const base = await applePay.buyWithApplePay(applePayUsd);
      onDeposited(Number(base) / 10 ** view.decimals);
    } catch {
      // surfaced via `applePay.error`
    }
  };
  // Once the on-ramp resolves, funds are still landing on-chain and can take a
  // few minutes — Privy has no "cancelled" result for a backed-out card flow, so
  // this is the only way out of that wait. Not offered mid-buy: the swap+deposit
  // tx is already signing by then.
  const canCancelApplePay = applePay.status === "funding" || applePay.status === "arriving";

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
          status={status}
          failedAt={failedAt}
          gas={checkOriginGas(payAsset, assets)}
          error={error}
          onConfirm={handleDeposit}
          onBack={() => setConfirming(false)}
        />
      </div>
    );
  }

  const cardRoutes: CardRoute[] = [
    {
      key: "builtin",
      // Labelled MoonPay: Privy can route this to Coinbase or Stripe, but MoonPay is
      // the default and the one whose coverage we've verified. Listing all three read
      // as jargon in a short list.
      title: "cardroute.builtin.title",
      body: "cardroute.builtin.body",
      // The Privy widget black-screens inside a mobile wallet's in-app browser. The
      // floor is the on-ramp's, and it reads the amount from the field above — Paybis
      // asks for its own, hence the wording.
      unavailable: !canUseCard
        ? t("deposit.cardInAppBrowser")
        : applePayBelowMin
          ? t("cardroute.belowMin", { min: String(APPLE_PAY_MIN_USD) })
          : undefined,
      onSelect: handleApplePay,
    },
    ...(paybisTopUp
      ? [
          {
            key: "paybis",
            title: "cardroute.paybis.title",
            body: "cardroute.paybis.body",
            onSelect: () => setShowTopUp(true),
          } satisfies CardRoute,
        ]
      : []),
  ];
  // A chooser with one option is just a slower button: with Paybis off, the card
  // button runs the built-in route itself, and carries that route's own blockers.
  const onlyRoute = cardRoutes.length === 1 ? cardRoutes[0] : null;

  return (
    <div className="p-4 rounded-[6px] border border-black/10 bg-white">
      {/* Label the field as the PAYMENT method — without this the prominent "USDC"
          reads as if the user is buying USDC, not paying with it for the asset. */}
      <p className="text-[10px] lowercase tracking-wide text-black/40 mb-2">{t("deposit.payWith")}</p>

      {/* Pay with: currency + amount in one field */}
      <div className="mt-2">
        {assetsLoading ? (
          <p className="text-xs text-black/40">{t("deposit.loadingAssets")}</p>
        ) : emptyWallet ? (
          !canUseCard ? (
            // Empty external wallet on mobile: no crypto to pay with, and the card
            // widget black-screens here — fund the wallet itself, then come back.
            <p className="text-xs text-black/40">{t("deposit.noAssets")}</p>
          ) : (
            // Empty wallet with a usable card route → enter how much to buy (USD).
            <div className="rounded-[12px] border border-black/10 px-3 py-2.5 transition-colors focus-within:border-black/30">
              <div className="flex items-center gap-1">
                <span className="text-[20px] text-black/40">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={buyUsdInput}
                  onChange={(e) => setBuyUsdInput(normalizeDecimalInput(e.target.value))}
                  placeholder={String(APPLE_PAY_MIN_USD)}
                  className="w-full bg-transparent text-[20px] text-black outline-none placeholder:text-black/25"
                />
              </div>
              <p className="mt-0.5 text-[10px] lowercase tracking-wide text-black/40">{t("deposit.buyAmountHint")}</p>
            </div>
          )
        ) : (
          <PayWithField
            assets={assets}
            activeUid={activeUid}
            onSelectUid={setSelectedUid}
            amount={effectiveAmount}
            onAmountChange={setAmount}
            usdAmount={usdAmount}
            productMint={view.assetMint}
            // With the relayer paying fees, the only SOL that must stay behind is the
            // wrapped-SOL rent — not a whole fee budget. External wallets still pay
            // their own fee, so they keep the larger reserve.
            reserveGas={!koraEnabled() || isExternal}
          />
        )}

        {/* How much of what you have, and what that is — the ceiling was only
            legible inside the field above, so typing meant guessing at it. */}
        {!emptyWallet && payAsset && (
          <AmountQuickPicks
            available={Number(spendableBase(payAsset, !koraEnabled() || isExternal)) / 10 ** payAsset.decimals}
            onPick={(v) => setAmount(String(Number(v.toFixed(payAsset.decimals))))}
            onTopUp={() => setShowFund(true)}
            disabled={busy}
          />
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

        {/* Advanced funding rail: pay from another chain (EVM → Delora bridge).
            Demoted to a quiet link — it's the heaviest path (several wallet
            confirmations), so the default stays USDC-on-Solana / card above. */}
        {!evmAddress ? (
          <button
            onClick={() => linkWallet()}
            className="mt-2 text-[11px] lowercase tracking-wide text-black/40 underline decoration-black/20 underline-offset-2 hover:text-black/70 transition"
          >
            {t("deposit.payFromAnotherChain")}
          </button>
        ) : (
          // Connected EVM wallet — let the user disconnect it (e.g. to link another).
          <div className="mt-2 flex items-center gap-2 text-[10px] lowercase tracking-wide text-black/45">
            <span>
              EVM {evmAddress.slice(0, 6)}…{evmAddress.slice(-4)}
            </span>
            <button
              onClick={() => unlinkWallet(evmAddress)}
              className="underline hover:text-black/70 transition"
            >
              {t("deposit.disconnect")}
            </button>
          </div>
        )}

        {/* Selected a cross-chain asset → warn that it confirms several steps. */}
        {payAsset?.chain === "ethereum" && (
          <p className="mt-2 text-[10px] lowercase tracking-wide text-amber-700/80">
            {t("deposit.bridgeConfirmsHint")}
          </p>
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
            (preview.kind === "bridge"
              ? ` · ${t("confirm.route.fee")} ~$${(preview.feeUsd ?? 0).toFixed(2)}${preview.etaSec ? ` · ~${preview.etaSec}s` : ""}`
              : t("deposit.afterSwap"))
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
            disabled={busy || (applePay.busy && !canCancelApplePay) || !payAsset || usdAmount <= 0 || bridgeBelowMin}
            className="mt-3 w-full px-4 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
          >
            {verb}
          </button>
          {bridgeBelowMin ? (
            <p className="mt-2 text-center text-[10px] lowercase tracking-wide text-black/40">
              {t("deposit.bridgeMinAmount", { value: `$${BRIDGE_MIN_USD}` })}
            </p>
          ) : error ? (
            <p className="mt-3 text-xs text-red-400 text-center">{localizeError(error, t)}</p>
          ) : null}
        </>
      )}

      {/* Divider only when the crypto path is also shown above. */}
      {!emptyWallet && (
        <div className="mt-3 flex items-center gap-3 text-[10px] lowercase tracking-wide text-black/30">
          <span className="h-px flex-1 bg-black/10" />
          {t("common.or")}
          <span className="h-px flex-1 bg-black/10" />
        </div>
      )}

      {/* One card button; which provider is a choice behind it (see CardRouteSheet).
          Two competing buttons made a vendor name the label, which means nothing to
          someone who has never heard of Paybis, and read as a fallback rather than
          what it is — also a card payment.

          While a card purchase is in flight this button stops being a chooser and
          becomes the progress/cancel control: a card window the user backed out of
          never resolves on its own, so that has to stay reachable. */}
      <button
        onClick={
          applePay.busy
            ? canCancelApplePay
              ? applePay.cancel
              : undefined
            : onlyRoute
              ? onlyRoute.onSelect
              : () => setShowRoutes(true)
        }
        disabled={(applePay.busy && !canCancelApplePay) || busy || !!onlyRoute?.unavailable}
        className="mt-3 w-full px-4 py-3 rounded-full bg-black text-white text-[15px] font-medium tracking-tight hover:bg-black/90 disabled:opacity-40 transition inline-flex items-center justify-center gap-1.5"
      >
        {applePay.busy ? (
          <span className="lowercase">
            {canCancelApplePay ? t("alloc.stopWaiting") : t(`status.${applePay.status}` as "status.buying")}
          </span>
        ) : (
          <>
            <CreditCard size={16} strokeWidth={1.75} />
            <span className="capitalize">{verb}</span>
            <span>with card</span>
          </>
        )}
      </button>

      {/* With no choice to open, the one route's blocker has to surface here — the
          chooser was the only thing saying why the button wouldn't work. */}
      {onlyRoute?.unavailable && !applePay.busy && (
        <p className="mt-2 text-center text-[10px] leading-snug lowercase tracking-wide text-black/40">
          {onlyRoute.unavailable}
        </p>
      )}

      {applePay.error && <p className="mt-2 text-xs text-red-500 text-center">{localizeError(applePay.error, t)}</p>}

      <AnimatePresence>
        {showRoutes && !onlyRoute && (
          <CardRouteSheet
            routes={cardRoutes}
            onClose={() => setShowRoutes(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{showTopUp && <TopUpSheet onClose={() => setShowTopUp(false)} />}</AnimatePresence>
      <AnimatePresence>{showFund && <FundSheet onClose={() => setShowFund(false)} />}</AnimatePresence>
    </div>
  );
}
