"use client";

import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Plus } from "lucide-react";

import { PayWithField } from "@/components/pay-with-field";
import { DepositConfirm } from "@/components/deposit-confirm";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useEvmAssets } from "@/hooks/use-evm-assets";
import { useDeposit } from "@/hooks/use-deposit";
import { useNetPreview } from "@/hooks/use-net-preview";
import { useSwapInPreview } from "@/hooks/use-swap-in-preview";
import type { ProviderView } from "@/hooks/use-yield-positions";

interface Props {
  view: ProviderView;
  onDeposited: (usdAmount: number) => void;
  /** Action verb — "Deposit" (default) for yield sources, "Buy" for stocks. */
  verb?: string;
}

/** Deposit with any asset on any chain: pick a pay-asset, enter an amount in that
 *  currency, see the net USDC. The money path stays USD-denominated underneath. */
export function DepositPanel({ view, onDeposited, verb = "Deposit" }: Props) {
  const lower = verb.toLowerCase();
  const { linkWallet, unlinkWallet } = usePrivy();
  const { assets: solAssets, loading: solLoading } = useWalletAssets();
  const { assets: evmAssets, evmAddress, loading: evmLoading } = useEvmAssets();
  const { depositWith, busy, label, error } = useDeposit(view.id);

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
      onDeposited(Number(depositedBase) / 10 ** view.decimals);
    } catch {
      // surfaced via `error`
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
      <p className="text-[10px] lowercase tracking-wide text-black/40 mb-2">{verb}</p>

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

        {/* Pay from another chain: link an external wallet (EVM) as a funding rail. */}
        {!evmAddress ? (
          <button
            onClick={() => linkWallet()}
            className="mt-2 inline-flex items-center gap-1 text-[10px] lowercase tracking-wide text-black/45 hover:text-black/70 transition"
          >
            <Plus size={11} strokeWidth={1.5} />
            Connect a wallet to pay from another chain
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
        disabled={busy || !payAsset || usdAmount <= 0}
        className="mt-3 w-full px-4 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
      >
        {verb}
      </button>

      {error && <p className="mt-3 text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
