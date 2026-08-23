"use client";

import { useState } from "react";
import { Check, ChevronDown, Wallet } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { AssetIcon } from "@/components/asset-icon";
import { TokenIcon } from "@/components/token-icon";
import type { Cashable } from "@/hooks/use-cashable";
import { useT } from "@/lib/i18n";

/**
 * What this purchase is paid with — dollars unless you say otherwise.
 *
 * Closed, it is one line: the method and what it's worth. It only opens when
 * pressed, because the answer is right for almost everybody almost always, and a
 * list of eleven things you could theoretically sell is not a decision anyone came
 * here to make.
 */
export function PayWithPicker({
  value,
  options,
  dollarsUsd,
  disabled,
  onChange,
}: {
  /** null = dollars. */
  value: Cashable | null;
  options: Cashable[];
  dollarsUsd: number;
  disabled?: boolean;
  onChange: (next: Cashable | null) => void;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const label = value ? value.symbol : t("alloc.dollars");
  const usd = value ? value.usd : dollarsUsd;

  return (
    <div className="rounded-control border border-ink/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition disabled:opacity-40"
      >
        {value ? (
          <Icon item={value} />
        ) : (
          <Wallet size={14} strokeWidth={1.5} className="shrink-0 text-ink/40" />
        )}
        <span className="min-w-0 flex-1 truncate text-[12px] lowercase tracking-wide text-ink/45">
          {t("pay.with")} · {label}
        </span>
        <span className="shrink-0 text-[13px] tabular-nums text-ink">${formatUsdAmount(usd)}</span>
        <ChevronDown
          size={14}
          strokeWidth={1.5}
          className={`shrink-0 text-ink/35 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-ink/[0.07] p-1.5">
          <Option
            picked={!value}
            label={t("alloc.dollars")}
            detail={t("pay.readyNow")}
            usd={dollarsUsd}
            leading={<Wallet size={16} strokeWidth={1.5} className="text-ink/40" />}
            onPick={() => {
              onChange(null);
              setOpen(false);
            }}
          />
          {options.map((item) => (
            <Option
              key={item.key}
              picked={value?.key === item.key}
              label={item.symbol}
              // Said on every row that isn't dollars: paying with it means turning it
              // into dollars first, and that is a trade with a price.
              detail={item.kind === "coin" ? t("pay.viaSwap") : t("pay.viaSale")}
              usd={item.usd}
              leading={<Icon item={item} />}
              onPick={() => {
                onChange(item);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}

      {/* Said whenever the answer isn't dollars, and said before anything is
          confirmed: paying with a thing means turning it into dollars first, and
          that is a trade at the market's price, not a transfer at ours. */}
      {value && (
        <p className="border-t border-ink/[0.07] px-3 py-2 text-[11px] leading-snug text-ink/45">
          {t(value.kind === "coin" ? "pay.noteSwap" : "pay.noteSale", { sym: value.symbol })}
        </p>
      )}
    </div>
  );
}

function Option({
  picked,
  label,
  detail,
  usd,
  leading,
  onPick,
}: {
  picked: boolean;
  label: string;
  detail: string;
  usd: number;
  leading: React.ReactNode;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`flex w-full items-center gap-2.5 rounded-field px-2.5 py-2 text-left transition hover:bg-ink/[0.04] ${
        picked ? "bg-ink/[0.04]" : ""
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{leading}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-ink">{label}</span>
        <span className="block truncate text-[10px] lowercase tracking-wide text-ink/35">{detail}</span>
      </span>
      <span className="shrink-0 text-[12px] tabular-nums text-ink/55">${formatUsdAmount(usd)}</span>
      {picked && <Check size={13} strokeWidth={2} className="shrink-0 text-ink/45" />}
    </button>
  );
}

/** A coin wears its token logo; a position wears the source's. */
function Icon({ item }: { item: Cashable }) {
  return item.kind === "coin" ? (
    <TokenIcon asset={item.asset} className="h-5 w-5 shrink-0 rounded-full" />
  ) : (
    <AssetIcon src={item.logo} label={item.symbol} size={20} className="shrink-0" />
  );
}
