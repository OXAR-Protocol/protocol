"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { TokenIcon } from "@/components/token-icon";
import { spendableBase, type WalletAsset } from "@/lib/portfolio/assets";

/** What happens to the funds + roughly how long, per funding route. */
export const routeTag = (a: WalletAsset, productMint: string) =>
  a.chain !== "solana" ? "bridge · ~2 min" : a.mint === productMint ? "instant" : "swap · ~5s";

/** Compact token-amount formatting: thousands for big, 4 sig-figs for small. */
const fmtAmount = (n: number) =>
  n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : Number(n.toPrecision(4));

interface Props {
  assets: WalletAsset[];
  activeMint: string | null;
  onSelectMint: (mint: string) => void;
  /** Raw input string, in the selected currency's units. */
  amount: string;
  onAmountChange: (value: string) => void;
  /** USD value of `amount` at the current price (shown under the field). */
  usdAmount: number;
  /** The product's own asset mint — drives the "instant" route tag. */
  productMint: string;
}

/**
 * One split field: pick the pay-currency on the left, enter the amount in that
 * currency on the right (USD equivalent shown beneath). The currency button
 * opens a list of the wallet's holdings.
 */
export function PayWithField({
  assets,
  activeMint,
  onSelectMint,
  amount,
  onAmountChange,
  usdAmount,
  productMint,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = assets.find((a) => a.mint === activeMint) ?? null;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const setMax = () => {
    if (!active) return;
    // Floor to the asset's precision — NEVER round up. `toPrecision` rounds to
    // nearest, so a balance like 1.999999 became "2.00000", pushing the recomputed
    // spend above the real balance → false "Not enough". Flooring keeps MAX ≤ balance.
    const dec = active.decimals;
    const max = Number(spendableBase(active)) / 10 ** dec;
    const floored = Math.floor(max * 10 ** dec) / 10 ** dec;
    onAmountChange(String(floored));
  };

  return (
    <div
      ref={ref}
      className="relative rounded-[12px] border border-black/10 transition-colors focus-within:border-black/30"
    >
      <div className="flex items-stretch">
        {/* Currency selector */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex shrink-0 items-center gap-2 border-r border-black/10 px-3 py-3"
        >
          {active ? (
            <TokenIcon asset={active} className="h-5 w-5" />
          ) : (
            <span className="h-5 w-5 rounded-full bg-black/10" />
          )}
          <span className="text-[14px] font-medium text-black">{active?.symbol ?? "—"}</span>
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className={`text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Amount in the selected currency + USD equivalent */}
        <div className="flex min-w-0 flex-1 flex-col items-end justify-center px-3 py-1.5">
          <input
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className="w-full bg-transparent text-right text-[20px] text-black outline-none placeholder:text-black/25"
          />
          <span className="text-[11px] tabular-nums text-black/40">${usdAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Route + balance/max */}
      <div className="-mt-0.5 flex items-center justify-between px-3 pb-2">
        <span className="text-[9px] lowercase tracking-wide text-black/40">
          {active ? routeTag(active, productMint) : ""}
        </span>
        {active && (
          <button
            type="button"
            onClick={setMax}
            className="text-[10px] lowercase tracking-wide text-black/40 transition hover:text-black/70"
          >
            balance {fmtAmount(active.uiAmount)} · max
          </button>
        )}
      </div>

      {/* Holdings picker */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-[12px] border border-black/15 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {assets.map((a) => (
            <button
              key={a.mint}
              type="button"
              onClick={() => {
                onSelectMint(a.mint);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-black/[0.04] ${
                a.mint === activeMint ? "bg-black/[0.03]" : ""
              }`}
            >
              <TokenIcon asset={a} className="h-6 w-6" />
              <span className="flex min-w-0 flex-col">
                <span className="flex items-center gap-1.5">
                  <span className="text-[13px] font-medium text-black">{a.symbol}</span>
                  <span className="text-[9px] lowercase tracking-wide text-black/40">
                    {routeTag(a, productMint)}
                  </span>
                </span>
                <span className="text-[11px] text-black/45">
                  ${a.usdValue.toFixed(2)} · {fmtAmount(a.uiAmount)} {a.symbol}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
