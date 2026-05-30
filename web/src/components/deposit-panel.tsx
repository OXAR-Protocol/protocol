"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { CustomSelect } from "@/components/custom-select";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useUniversalDeposit } from "@/hooks/use-universal-deposit";
import type { ProviderView } from "@/hooks/use-yield-positions";
import { toBaseUnits } from "@/lib/yield";
import { getSwapQuote } from "@/lib/swap/jupiter-swap";

interface Props {
  view: ProviderView;
  onDeposited: (usdAmount: number) => void;
}

/** Deposit with any Solana asset: pick a pay-asset, enter USD, see net USDC. */
export function DepositPanel({ view, onDeposited }: Props) {
  const { assets, loading: assetsLoading } = useWalletAssets();
  const { depositWith, status, error } = useUniversalDeposit(view.id);

  const [usdAmount, setUsdAmount] = useState(50);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);

  // Default pay-asset: the product's own asset if held, else the largest holding.
  const defaultMint = useMemo(() => {
    if (assets.length === 0) return null;
    return assets.find((a) => a.mint === view.assetMint)?.mint ?? assets[0].mint;
  }, [assets, view.assetMint]);
  const activeMint = selectedMint ?? defaultMint;
  const payAsset = assets.find((a) => a.mint === activeMint) ?? null;
  const isDirect = payAsset?.mint === view.assetMint;

  // Live net quote for swap paths (debounced); direct path nets the full amount.
  const [netUsdc, setNetUsdc] = useState<number | null>(null);
  const [quoting, setQuoting] = useState(false);
  useEffect(() => {
    if (!payAsset || usdAmount <= 0) {
      setNetUsdc(null);
      return;
    }
    if (isDirect) {
      setNetUsdc(usdAmount);
      return;
    }
    let cancelled = false;
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const price = payAsset.usdValue / payAsset.uiAmount;
        const payBase = toBaseUnits((usdAmount / price).toFixed(payAsset.decimals), payAsset.decimals);
        const q = await getSwapQuote({ inputMint: payAsset.mint, outputMint: view.assetMint, amount: payBase });
        // Show the guaranteed-min out — that's exactly what gets deposited.
        if (!cancelled) setNetUsdc(Number(q.otherAmountThreshold) / 10 ** view.decimals);
      } catch {
        if (!cancelled) setNetUsdc(null);
      } finally {
        if (!cancelled) setQuoting(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [payAsset, usdAmount, isDirect, view.assetMint, view.decimals]);

  const busy = status !== "idle";
  const label =
    status === "swapping" ? "Swapping…" : status === "depositing" ? "Depositing…" : null;

  const handleDeposit = async () => {
    if (!payAsset || usdAmount <= 0) return;
    try {
      const depositedBase = await depositWith(payAsset, usdAmount);
      // Report the amount actually deposited (USDC ≈ USD), not the input USD.
      onDeposited(Number(depositedBase) / 10 ** view.decimals);
    } catch {
      // Error is surfaced via the hook's `error` state.
    }
  };

  return (
    <div className="p-4 rounded-[6px] border border-white/10">
      <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-2">
        Deposit
      </p>

      {/* USD amount */}
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-2xl text-white/40">$</span>
        <input
          type="number"
          min={0}
          step="any"
          value={usdAmount}
          onChange={(e) => setUsdAmount(Math.max(0, Number(e.target.value)))}
          className="flex-1 bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-2xl text-white py-1"
        />
      </div>

      {/* Pay-with picker */}
      <div className="mt-3">
        <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-1.5">
          Pay with
        </p>
        {assetsLoading ? (
          <p className="font-mono text-xs text-white/30">Loading your assets…</p>
        ) : assets.length === 0 ? (
          <p className="font-mono text-xs text-white/30">No assets found in your wallet.</p>
        ) : (
          <CustomSelect
            value={activeMint ?? ""}
            onChange={setSelectedMint}
            options={assets.map((a) => ({
              value: a.mint,
              label:
                `${a.symbol} · $${a.usdValue.toFixed(2)}` +
                (a.mint === view.assetMint ? " · ⚡ instant" : " · swap"),
            }))}
          />
        )}
      </div>

      {/* Net received */}
      {payAsset && usdAmount > 0 && (
        <p className="mt-2 font-mono text-[11px] text-white/40">
          {isDirect
            ? `you'll deposit $${usdAmount.toFixed(2)} ${view.assetSymbol}`
            : quoting
              ? "quoting…"
              : netUsdc !== null
                ? `you'll deposit ~$${netUsdc.toFixed(2)} ${view.assetSymbol} (after swap)`
                : "couldn't quote — try a smaller amount"}
        </p>
      )}

      <button
        onClick={handleDeposit}
        disabled={busy || !payAsset || usdAmount <= 0}
        className="mt-3 w-full px-4 py-2.5 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            {label}
          </>
        ) : (
          "Deposit"
        )}
      </button>

      {error && <p className="mt-3 font-mono text-xs text-red-400 text-center">{error}</p>}
    </div>
  );
}
