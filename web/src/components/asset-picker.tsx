"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { TokenIcon } from "@/components/token-icon";
import type { WalletAsset } from "@/lib/portfolio/assets";

const fmt = (n: number) =>
  n >= 1 ? n.toLocaleString("en-US", { maximumFractionDigits: 2 }) : Number(n.toPrecision(4));

/** Icon-based wallet-asset dropdown (same look as the buy picker): logo + symbol +
 *  balance. Click-outside to close. Pure selection — amount lives elsewhere. */
export function AssetPicker({
  assets,
  value,
  onChange,
}: {
  assets: WalletAsset[];
  value: string | null;
  onChange: (mint: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = assets.find((a) => a.mint === value) ?? null;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-black/10 px-3 py-2.5 transition hover:border-black/30"
      >
        <span className="flex min-w-0 items-center gap-2">
          {active ? (
            <TokenIcon asset={active} className="h-5 w-5" />
          ) : (
            <span className="h-5 w-5 rounded-full bg-black/10" />
          )}
          <span className="text-[14px] font-medium text-black">{active?.symbol ?? "—"}</span>
          {active && <span className="text-[12px] tabular-nums text-black/40">· {fmt(active.uiAmount)}</span>}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={1.5}
          className={`shrink-0 text-black/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-[10px] border border-black/15 bg-white py-1 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {assets.map((a) => (
            <button
              key={a.mint}
              type="button"
              onClick={() => {
                onChange(a.mint);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-black/[0.04] ${
                a.mint === value ? "bg-black/[0.03]" : ""
              }`}
            >
              <TokenIcon asset={a} className="h-6 w-6" />
              <span className="flex min-w-0 flex-col">
                <span className="text-[13px] font-medium text-black">{a.symbol}</span>
                <span className="text-[11px] tabular-nums text-black/45">
                  {fmt(a.uiAmount)} · ${a.usdValue.toFixed(2)}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
