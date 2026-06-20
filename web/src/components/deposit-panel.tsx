"use client";

import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Plus } from "lucide-react";

import { PayWithField } from "@/components/pay-with-field";
import { DepositConfirm } from "@/components/deposit-confirm";
import { useSolanaContext } from "@/providers/solana-provider";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useEvmAssets } from "@/hooks/use-evm-assets";
import { useDeposit } from "@/hooks/use-deposit";
import { useFundAndBuy } from "@/hooks/use-fund-and-buy";
import { useNetPreview } from "@/hooks/use-net-preview";
import { useSwapInPreview } from "@/hooks/use-swap-in-preview";
import type { ProviderView } from "@/hooks/use-yield-positions";

/** Apple logo as inline SVG (renders on every platform, unlike the  glyph). */
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" fill="currentColor" className={className} aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

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
  const lower = verb.toLowerCase();
  const { linkWallet, unlinkWallet } = usePrivy();
  // Apple Pay / card on-ramp is for users WITHOUT crypto (email login → embedded
  // wallet). A user who logged in with an external wallet (Phantom) already has
  // crypto AND runs inside that wallet's in-app browser, where the card widget
  // can't render (black screen) — so don't offer it to them.
  const { isExternal } = useSolanaContext();
  const { assets: solAssets, loading: solLoading } = useWalletAssets();
  const { assets: evmAssets, evmAddress, loading: evmLoading } = useEvmAssets();
  const { depositWith, busy, label, error } = useDeposit(view.id);
  // Apple Pay / card path — funds fresh USDC via Privy's on-ramp, then buys.
  // Works with no crypto in the wallet (the whole point), so it's independent
  // of the pay-asset picker below.
  const applePay = useFundAndBuy(view.id);

  // Amount is entered in the selected currency's units; USD is derived for the
  // (USD-denominated) money path below via the asset's unit price. `null` = the
  // field is untouched, so it shows a ≈ $50 default of the current currency.
  const [amount, setAmount] = useState<string | null>(null);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  // Show the "no surprises" review before the deposit signs.
  const [confirming, setConfirming] = useState(false);

  // Solana first (instant/swap), then EVM (bridge).
  const assets = useMemo(() => [...solAssets, ...evmAssets], [solAssets, evmAssets]);
  const assetsLoading = solLoading || evmLoading;

  // Default: the product's own asset if held, else the largest Solana holding, else first.
  const defaultMint = useMemo(() => {
    if (assets.length === 0) return null;
    return (
      assets.find((a) => a.chain === "solana" && a.mint === view.assetMint)?.mint ??
      solAssets[0]?.mint ??
      assets[0].mint
    );
  }, [assets, solAssets, view.assetMint]);

  const activeMint = selectedMint ?? defaultMint;
  const payAsset = assets.find((a) => a.mint === activeMint) ?? null;
  const isDirect = payAsset?.chain === "solana" && payAsset.mint === view.assetMint;

  const unitPrice = payAsset && payAsset.uiAmount > 0 ? payAsset.usdValue / payAsset.uiAmount : 0;
  // Until the user types, default to ≈ $50 of the selected currency.
  const defaultAmount = unitPrice > 0 ? String(Number((50 / unitPrice).toPrecision(4))) : "";
  const effectiveAmount = amount ?? defaultAmount;
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

  // Apple Pay buys a fixed USD value (the typed amount if any, else ~$50). No
  // pay-asset needed — the on-ramp delivers fresh USDC, then we buy.
  const applePayUsd = usdAmount > 0 ? usdAmount : 50;
  const handleApplePay = async () => {
    try {
      const base = await applePay.buyWithApplePay(applePayUsd);
      onDeposited(Number(base) / 10 ** view.decimals);
    } catch {
      // surfaced via `applePay.error`
    }
  };

  if (confirming && payAsset) {
    return (
      <div className="p-4 rounded-[6px] border border-black/10">
        <DepositConfirm
          verb={verb}
          usdAmount={usdAmount}
          payAsset={payAsset}
          view={view}
          isDirect={isDirect}
          preview={preview}
          swapIn={swapIn}
          busy={busy}
          label={label}
          error={error}
          onConfirm={handleDeposit}
          onBack={() => setConfirming(false)}
        />
      </div>
    );
  }

  return (
    <div className="p-4 rounded-[6px] border border-black/10">
      {/* Label the field as the PAYMENT method — without this the prominent "USDC"
          reads as if the user is buying USDC, not paying with it for the asset. */}
      <p className="text-[10px] lowercase tracking-wide text-black/40 mb-2">pay with</p>

      {/* Pay with: currency + amount in one field */}
      <div className="mt-2">
        {assetsLoading ? (
          <p className="text-xs text-black/40">Loading your assets…</p>
        ) : assets.length === 0 ? (
          <p className="text-xs text-black/40">No assets found in your wallet.</p>
        ) : (
          <PayWithField
            assets={assets}
            activeMint={activeMint}
            onSelectMint={setSelectedMint}
            amount={effectiveAmount}
            onAmountChange={setAmount}
            usdAmount={usdAmount}
            productMint={view.assetMint}
          />
        )}

        {/* Quantity shortcut — type how many units to buy; the pay amount fills in. */}
        {canQuantity && payAsset && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-[10px] border border-black/10 px-3 py-2">
            <span className="text-[11px] lowercase tracking-wide text-black/40">{lower}</span>
            <input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={sharesValue ? Number(sharesValue.toPrecision(4)) : ""}
              onChange={(e) => onSharesChange(e.target.value)}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent text-right text-[15px] text-black outline-none placeholder:text-black/25"
            />
            <span className="shrink-0 text-[12px] text-black/45">{unitLabel}</span>
          </div>
        )}

        {/* Pay from another chain: link an external wallet (EVM) as a funding rail. */}
        {!evmAddress ? (
          <button
            onClick={() => linkWallet()}
            className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-2.5 text-[13px] lowercase tracking-wide text-black/70 hover:border-black/40 hover:text-black transition"
          >
            <Plus size={15} strokeWidth={1.75} />
            pay from another chain
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
              disconnect
            </button>
          </div>
        )}
      </div>

      {/* Net received */}
      {payAsset && usdAmount > 0 && (
        <p className="mt-2 text-[11px] text-black/45">
          {view.heldMint ? (
            // Swap-and-hold: show what you'll actually hold + the swap cost.
            swapIn.quoting
              ? "quoting…"
              : swapIn.valueUsd !== null
                ? `you'll hold ≈ $${swapIn.valueUsd.toFixed(2)}` +
                  (swapIn.spreadUsd && swapIn.spreadUsd > 0
                    ? ` · swap cost ~$${swapIn.spreadUsd < 0.01 ? swapIn.spreadUsd.toFixed(4) : swapIn.spreadUsd.toFixed(2)}`
                    : "")
                : "couldn't quote — try a different amount"
          ) : isDirect ? (
            `you'll ${lower} $${usdAmount.toFixed(2)} ${view.assetSymbol}`
          ) : preview.quoting ? (
            "quoting…"
          ) : preview.netUsdc !== null ? (
            `you'll ${lower} ~$${preview.netUsdc.toFixed(2)} ${view.assetSymbol}` +
            (preview.kind === "bridge"
              ? ` · fee ~$${(preview.feeUsd ?? 0).toFixed(2)}${preview.etaSec ? ` · ~${preview.etaSec}s` : ""}`
              : " (after swap)")
          ) : (
            "couldn't quote — try a different amount"
          )}
        </p>
      )}

      <button
        onClick={() => setConfirming(true)}
        disabled={busy || applePay.busy || !payAsset || usdAmount <= 0}
        className="mt-3 w-full px-4 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
      >
        {verb}
      </button>

      {error && <p className="mt-3 text-xs text-red-400 text-center">{error}</p>}

      {/* Apple Pay / card — only for embedded (email) wallets. External-wallet
          (Phantom) users already have crypto and run inside the wallet's in-app
          browser, where the card widget can't render. They pay with their crypto. */}
      {!isExternal && (
        <>
          <div className="mt-3 flex items-center gap-3 text-[10px] lowercase tracking-wide text-black/30">
            <span className="h-px flex-1 bg-black/10" />
            or
            <span className="h-px flex-1 bg-black/10" />
          </div>
          <button
            onClick={handleApplePay}
            disabled={applePay.busy || busy}
            className="mt-3 w-full px-4 py-3 rounded-full bg-black text-white text-[15px] font-medium tracking-tight hover:bg-black/90 disabled:opacity-40 transition inline-flex items-center justify-center gap-1.5"
          >
            {applePay.busy ? (
              <span className="lowercase">{applePay.label}</span>
            ) : (
              <>
                <span className="capitalize">{verb}</span>
                <span>with</span>
                <AppleLogo className="h-[15px] w-auto -translate-y-[1px]" />
                <span>Pay</span>
              </>
            )}
          </button>
          <p className="mt-2 text-center text-[10px] lowercase tracking-wide text-black/30">
            ≈ ${applePayUsd.toFixed(0)} · apple pay or card · no crypto needed
          </p>

          {applePay.error && <p className="mt-2 text-xs text-red-500 text-center">{applePay.error}</p>}
        </>
      )}
    </div>
  );
}
