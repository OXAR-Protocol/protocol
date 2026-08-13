"use client";

import { ChevronRight } from "lucide-react";

import { formatUsdAmount, type WalletAsset } from "@oxar/sdk";

import { AmountKeypad } from "@/components/amount-keypad";
import { AnimatedAmount } from "@/components/animated-amount";
import { TokenIcon } from "@/components/token-icon";
import { maxSendable } from "@/lib/wallet/transfer";
import { useT } from "@/lib/i18n";

const FRACTIONS = [0.1, 0.25, 0.5, 1] as const;

/** Trim a computed fraction to something a person would type. */
const tidy = (n: number, decimals: number) =>
  String(Number(n.toFixed(Math.min(decimals, 6)))).replace(/\.?0+$/, "") || "0";

/**
 * How much, and of what.
 *
 * The sum is the screen — it gets the size, its own keypad, and four fractions for
 * the answers most people actually give. What's being sent sits under it as one
 * pill: dollars unless you say otherwise, and tapping it opens everything else the
 * wallet holds.
 */
export function SendAmount({
  asset,
  value,
  onChange,
  onPickToken,
  onContinue,
  note,
}: {
  asset: WalletAsset;
  value: string;
  onChange: (v: string) => void;
  onPickToken: () => void;
  onContinue: () => void;
  /** What lands on the other side, when a bridge is in the way. */
  note?: string;
}) {
  const { t } = useT();
  const available = Number(maxSendable(asset)) / 10 ** asset.decimals;
  const typed = Number(value);
  const overspending = Number.isFinite(typed) && typed > available;
  const ready = Number.isFinite(typed) && typed > 0 && !overspending;
  // A dollar figure beside the token amount, because "0.42 SOL" is not a sum anyone
  // has an instinct for. Skipped when we can't price the asset.
  const unitPrice = asset.uiAmount > 0 ? asset.usdValue / asset.uiAmount : 0;

  return (
    <>
      <p className="text-center text-[2.6rem] font-light leading-none tracking-[-0.03em] text-black">
        <AnimatedAmount value={value} />
        <span className="ml-2 text-[1.4rem] text-black/40">{asset.symbol}</span>
      </p>
      {unitPrice > 0 && (
        <p className="mt-1.5 text-center text-[12px] tabular-nums text-black/40">
          ≈ ${formatUsdAmount((Number(value) || 0) * unitPrice)}
        </p>
      )}

      {/* What's being sent. One pill, centred under the sum — the same shape fomo
          uses for "cash balance", and the door to everything else held. */}
      <button
        type="button"
        onClick={onPickToken}
        className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-black/12 py-1.5 pl-1.5 pr-3 transition hover:border-black/40"
      >
        <TokenIcon asset={asset} className="h-7 w-7 shrink-0 rounded-full" />
        <span className="text-[14px] text-black">{asset.symbol}</span>
        <span className="text-[12px] tabular-nums text-black/40">
          {available.toLocaleString(undefined, { maximumFractionDigits: 6 })}
        </span>
        <ChevronRight size={15} strokeWidth={1.5} className="text-black/30" />
      </button>

      <div className="mt-5 flex gap-1.5">
        {FRACTIONS.map((f) => (
          <button
            key={f}
            type="button"
            disabled={available <= 0}
            onClick={() => onChange(tidy(available * f, asset.decimals))}
            className="flex-1 rounded-full border border-black/15 py-1.5 text-[11px] lowercase tracking-wide text-black/55 transition hover:border-black/40 hover:text-black disabled:opacity-40"
          >
            {f === 1 ? t("rail.max") : `${f * 100}%`}
          </button>
        ))}
      </div>

      <div className="mt-3">
        <AmountKeypad value={value} onChange={onChange} maxDecimals={Math.min(asset.decimals, 6)} />
      </div>

      {note && <p className="mt-2 text-center text-[11px] tabular-nums text-black/45">{note}</p>}

      <button
        type="button"
        onClick={onContinue}
        disabled={!ready}
        className="mt-3 w-full rounded-full bg-black px-4 py-3.5 text-[14px] lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-25"
      >
        {overspending ? t("send.notEnough", { sym: asset.symbol }) : t("send.review.open")}
      </button>
    </>
  );
}
