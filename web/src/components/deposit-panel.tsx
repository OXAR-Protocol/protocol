"use client";

import { useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2, Plus } from "lucide-react";

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

/** Settlement label per funding route — what happens + roughly how long. */
const routeTag = (a: { chain: string }, isDirect: boolean) =>
  a.chain !== "solana" ? "bridge · ~2 min" : isDirect ? "instant" : "swap · ~5s";

/** Deposit with any asset on any chain: pick a pay-asset, enter USD, see net USDC. */
export function DepositPanel({ view, onDeposited, verb = "Deposit" }: Props) {
  const lower = verb.toLowerCase();
  const { linkWallet, unlinkWallet } = usePrivy();
  const { assets: solAssets, loading: solLoading } = useWalletAssets();
  const { assets: evmAssets, evmAddress, loading: evmLoading } = useEvmAssets();
  const { depositWith, busy, label, error } = useDeposit(view.id);

  const [usdAmount, setUsdAmount] = useState(50);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);

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

  return (
    <div className="p-4 rounded-[6px] border border-black/10">
      <p className="text-[10px] lowercase tracking-wide text-black/40 mb-2">{verb}</p>

      {/* USD amount */}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl text-black/45">$</span>
        <input
          type="number"
          min={0}
          step="any"
          value={usdAmount}
          onChange={(e) => setUsdAmount(Math.max(0, Number(e.target.value)))}
          className="flex-1 bg-transparent border-b border-black/15 focus:border-black/40 outline-none text-2xl text-black py-1"
        />
      </div>

      {/* Pay-with picker */}
      <div className="mt-3">
        <p className="text-[10px] lowercase tracking-wide text-black/40 mb-1.5">Pay with</p>
        {assetsLoading ? (
          <p className="text-xs text-black/40">Loading your assets…</p>
        ) : assets.length === 0 ? (
          <p className="text-xs text-black/40">No assets found in your wallet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {assets.map((a) => {
              const isActive = a.mint === activeMint;
              const tag = routeTag(a, a.chain === "solana" && a.mint === view.assetMint);
              return (
                <button
                  key={a.mint}
                  type="button"
                  onClick={() => setSelectedMint(a.mint)}
                  className={`flex flex-col items-start gap-0.5 rounded-[10px] border px-3 py-2 text-left transition ${
                    isActive
                      ? "border-[#3c05c7] bg-[#3c05c7]/[0.05]"
                      : "border-black/10 hover:border-black/30"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`text-[13px] font-medium ${isActive ? "text-black" : "text-black/80"}`}>
                      {a.symbol}
                    </span>
                    <span className="text-[9px] lowercase tracking-wide text-black/40">
                      {tag}
                    </span>
                  </span>
                  <span className="text-[11px] tabular-nums text-black/45">
                    ${a.usdValue.toFixed(2)}
                  </span>
                </button>
              );
            })}
          </div>
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
        onClick={handleDeposit}
        disabled={busy || !payAsset || usdAmount <= 0}
        className="mt-3 w-full px-4 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            {label}
          </>
        ) : (
          verb
        )}
      </button>

      {error && <p className="mt-3 text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
