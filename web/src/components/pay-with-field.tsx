"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpDown, ChevronDown } from "lucide-react";

import { TokenIcon } from "@/components/token-icon";
import { spendableBase, assetUid, assetNetworkLabel, type WalletAsset } from "@oxar/sdk";

/** What happens to the funds + roughly how long, per funding route. */
export const routeTag = (a: WalletAsset, productMint: string) =>
  a.chain !== "solana" ? "bridge · ~2 min" : a.mint === productMint ? "instant" : "swap · ~5s";

/** Compact token-amount formatting: thousands for big, 4 sig-figs for small. */
const fmtAmount = (n: number) =>
  n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : Number(n.toPrecision(4));

interface Props {
  assets: WalletAsset[];
  /** Unique id of the selected asset (from `assetUid`) — NOT the mint, which
   *  collides for native EVM coins across networks. */
  activeUid: string | null;
  onSelectUid: (uid: string) => void;
  /** Raw input string, always in the pay-currency's TOKEN units (the source of
   *  truth); the field can present a USD entry that writes back token units. */
  amount: string;
  onAmountChange: (value: string) => void;
  /** USD value of `amount` at the current price (shown under the field). */
  usdAmount: number;
  /** The product's own asset mint — drives the "instant" route tag. */
  productMint: string;
  /** Reserve SOL for the network fee in "max" (external wallets); embedded pay no fee. */
  reserveGas?: boolean;
}

/**
 * One split field: pick the pay-currency on the left, enter the amount on the
 * right. The ⇅ button toggles the entry between the token amount and USD — the
 * other unit is shown beneath. `amount` (token units) stays the source of truth,
 * so the money path is unchanged; USD entry just converts back at the price.
 */
export function PayWithField({
  assets,
  activeUid,
  onSelectUid,
  amount,
  onAmountChange,
  usdAmount,
  productMint,
  reserveGas = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"token" | "usd">("token");
  const [usdStr, setUsdStr] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const active = assets.find((a) => assetUid(a) === activeUid) ?? null;
  const price = active && active.uiAmount > 0 ? active.usdValue / active.uiAmount : 0;
  const tokenAmt = parseFloat(amount) || 0;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Switching the pay-asset while in USD mode: keep the $ amount, re-derive the
  // token for the new price. Keyed on activeUid only, so typing never re-runs it.
  useEffect(() => {
    if (mode !== "usd") return;
    const usd = parseFloat(usdStr) || 0;
    onAmountChange(usd > 0 && price ? String(Number((usd / price).toPrecision(8))) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeUid]);

  const toTokenStr = (usd: number) => (usd > 0 && price ? String(Number((usd / price).toPrecision(8))) : "");
  const toUsdStr = (tok: number) => (tok > 0 && price ? String(Number((tok * price).toFixed(2))) : "");

  const toggleMode = () => {
    if (!active) return;
    if (mode === "token") {
      setUsdStr(toUsdStr(tokenAmt));
      setMode("usd");
    } else {
      setMode("token");
    }
  };

  const onInput = (v: string) => {
    if (mode === "usd") {
      setUsdStr(v);
      onAmountChange(toTokenStr(parseFloat(v) || 0));
    } else {
      onAmountChange(v);
    }
  };

  const setMax = () => {
    if (!active) return;
    // Floor to the asset's precision — NEVER round up. `toPrecision` rounds to
    // nearest, so a balance like 1.999999 became "2.00000", pushing the spend above
    // the real balance → false "Not enough". Flooring keeps MAX ≤ balance.
    const dec = active.decimals;
    const max = Math.floor(Number(spendableBase(active, reserveGas)) / 10 ** dec * 10 ** dec) / 10 ** dec;
    onAmountChange(String(max));
    if (mode === "usd") setUsdStr(toUsdStr(max));
  };

  const inputValue = mode === "usd" ? usdStr : amount;

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
          <span className="flex flex-col items-start leading-tight">
            <span className="text-[14px] font-medium text-black">{active?.symbol ?? "—"}</span>
            {active && (
              <span className="text-[9px] lowercase tracking-wide text-black/40">{assetNetworkLabel(active)}</span>
            )}
          </span>
          <ChevronDown
            size={13}
            strokeWidth={1.5}
            className={`text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {/* Amount — token or USD, toggled by the ⇅ button. USD equivalent (or token) below. */}
        <div className="flex min-w-0 flex-1 flex-col items-end justify-center px-3 py-1.5">
          <div className="flex w-full items-center justify-end gap-1">
            <button
              type="button"
              onClick={toggleMode}
              disabled={!active}
              title="Switch between $ and token"
              aria-label="Switch between dollars and token amount"
              className="shrink-0 text-black/30 transition hover:text-black/70 disabled:opacity-30"
            >
              <ArrowUpDown size={14} strokeWidth={1.5} />
            </button>
            {mode === "usd" && <span className="text-[20px] text-black/40">$</span>}
            <input
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={inputValue}
              onChange={(e) => onInput(e.target.value)}
              placeholder="0.00"
              className="min-w-0 flex-1 bg-transparent text-right text-[20px] text-black outline-none placeholder:text-black/25"
            />
          </div>
          <span className="text-[11px] tabular-nums text-black/40">
            {mode === "usd" ? `${fmtAmount(tokenAmt)} ${active?.symbol ?? ""}` : `$${usdAmount.toFixed(2)}`}
          </span>
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
          {assets.map((a) => {
            const uid = assetUid(a);
            const net = assetNetworkLabel(a);
            return (
              <button
                key={uid}
                type="button"
                onClick={() => {
                  onSelectUid(uid);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-black/[0.04] ${
                  uid === activeUid ? "bg-black/[0.03]" : ""
                }`}
              >
                <TokenIcon asset={a} className="h-6 w-6" />
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-black">{a.symbol}</span>
                    {net && (
                      <span className="rounded bg-black/[0.06] px-1.5 py-px text-[9px] tracking-wide text-black/55">
                        {net}
                      </span>
                    )}
                    <span className="text-[9px] lowercase tracking-wide text-black/40">
                      {routeTag(a, productMint)}
                    </span>
                  </span>
                  <span className="text-[11px] text-black/45">
                    ${a.usdValue.toFixed(2)} · {fmtAmount(a.uiAmount)} {a.symbol}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
