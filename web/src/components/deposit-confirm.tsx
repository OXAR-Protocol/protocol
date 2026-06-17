"use client";

import { Loader2 } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import type { NetPreview } from "@/hooks/use-net-preview";
import type { SwapInPreview } from "@/hooks/use-swap-in-preview";
import type { WalletAsset } from "@/lib/portfolio/assets";

interface Props {
  verb: string;
  usdAmount: number;
  payAsset: WalletAsset;
  view: ProviderView;
  isDirect: boolean;
  preview: NetPreview;
  swapIn: SwapInPreview;
  busy: boolean;
  label: string | null;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

const money = (n: number) => `$${(n < 0.01 ? n.toFixed(4) : n.toFixed(2)).replace(/0+$/, "").replace(/\.$/, "")}`;

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-baseline justify-between gap-3 py-2">
    <span className="lowercase text-[12px] text-black/45">{k}</span>
    <span className="text-[13px] tabular-nums text-black text-right">{v}</span>
  </div>
);

/** "No surprises" review shown before a deposit signs: what you pay, what you'll
 *  actually hold (net of the swap), where it goes, and that you stay in control. */
export function DepositConfirm({
  verb,
  usdAmount,
  payAsset,
  view,
  isDirect,
  preview,
  swapIn,
  busy,
  label,
  error,
  onConfirm,
  onBack,
}: Props) {
  const held = !!view.heldMint;
  const route = isDirect
    ? "instant"
    : payAsset.chain === "ethereum"
      ? `bridge${preview.etaSec ? ` · ~${Math.round(preview.etaSec / 60)} min` : ""}${preview.feeUsd ? ` · fee ~${money(preview.feeUsd)}` : ""}`
      : "swap · ~5s";

  // What you'll end up with, net of any conversion.
  const get = held
    ? swapIn.quoting
      ? "quoting…"
      : swapIn.valueUsd !== null
        ? `≈ ${money(swapIn.valueUsd)} ${view.assetSymbol}`
        : "—"
    : isDirect
      ? `${money(usdAmount)} ${view.assetSymbol}`
      : preview.quoting
        ? "quoting…"
        : preview.netUsdc !== null
          ? `≈ ${money(preview.netUsdc)} ${view.assetSymbol}`
          : "—";
  const swapCost = held && swapIn.spreadUsd && swapIn.spreadUsd > 0 ? swapIn.spreadUsd : null;

  return (
    <div>
      <p className="text-[10px] lowercase tracking-wide text-black/40 mb-2">review your {verb.toLowerCase()}</p>

      <div className="divide-y divide-black/5">
        <Row k="you pay" v={`${money(usdAmount)} · ${payAsset.symbol}`} />
        <Row k={held ? "you'll hold" : "you'll get"} v={get} />
        {swapCost !== null && <Row k="swap cost (one-time)" v={`~${money(swapCost)}`} />}
        <Row k="route" v={route} />
        <Row k="where it goes" v={held ? "your own wallet" : view.name} />
      </div>

      <p className="mt-3 text-[11px] leading-snug text-black/45">
        withdraw anytime · no lock · OXAR never holds your funds — your wallet signs it.
      </p>

      {error && <p className="mt-3 text-xs text-red-500 text-center">{error}</p>}

      <button
        onClick={onConfirm}
        disabled={busy}
        className="mt-4 w-full px-4 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            {label}
          </>
        ) : (
          `confirm ${verb.toLowerCase()}`
        )}
      </button>
      <button
        onClick={onBack}
        disabled={busy}
        className="mt-2 w-full py-2 text-[12px] lowercase tracking-wide text-black/45 hover:text-black/70 disabled:opacity-30 transition"
      >
        back
      </button>
    </div>
  );
}
