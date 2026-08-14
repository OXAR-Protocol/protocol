"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { AmountKeypad } from "@/components/amount-keypad";
import { AnimatedAmount } from "@/components/animated-amount";
import { AssetIcon } from "@/components/asset-icon";
import { SheetRow } from "@/components/sheet-row";
import { TokenIcon } from "@/components/token-icon";
import { useBulkFunding } from "@/hooks/use-bulk-funding";
import { useBulkTrade } from "@/hooks/use-bulk-trade";
import { useCashable, MIN_CASH_USD, type Cashable } from "@/hooks/use-cashable";
import { toFriendlyError } from "@/lib/yield";
import { useT, localizeError } from "@/lib/i18n";

const FRACTIONS = [0.25, 0.5, 1] as const;

/**
 * Turning anything you hold into dollars.
 *
 * Coins used to double as a way to pay: the buy panel would swap whatever you held
 * on the way into a purchase. That hid a trade inside a purchase. Now buying spends
 * dollars only, and this is where everything else becomes dollars — a loose coin by
 * a swap, a position by selling it. Two different roads, one question, so one list:
 * asked "what can I turn into money", the honest answer is all of it.
 *
 * The amount is yours to choose. It used to convert whole balances on a single tap,
 * which is a decision made for someone rather than by them.
 */
export function FundConvert({ onConverted }: { onConverted: () => void }) {
  const { t } = useT();
  const { items, loading } = useCashable();
  const { fundUsdc, converting } = useBulkFunding();
  const bulk = useBulkTrade();
  const [picked, setPicked] = useState<Cashable | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busy = converting || bulk.state === "running";
  const available = picked?.usd ?? 0;
  const typed = Number(amount);
  const ready = Number.isFinite(typed) && typed >= MIN_CASH_USD && typed <= available;

  const run = async () => {
    if (!picked || !ready) return;
    setError(null);
    try {
      if (picked.kind === "coin") {
        await fundUsdc(picked.asset, typed);
      } else {
        // The same sale the asset's own page runs — one implementation, so cost
        // basis and the earnings view can't disagree about what left.
        const [outcome] = await bulk.run([
          {
            kind: "sell",
            id: picked.view.id,
            shares: picked.view.shares,
            valueUsd: picked.usd,
            amountUsd: typed,
          },
        ]);
        if (outcome && !outcome.ok) throw new Error(outcome.error ?? "Sale failed");
      }
      onConverted();
    } catch (e) {
      console.error("Turning into dollars failed:", e);
      setError(toFriendlyError(e));
    }
  };

  if (loading) return <p className="text-[13px] text-black/45">{t("deposit.loadingAssets")}</p>;

  if (picked) {
    return (
      <>
        <button
          type="button"
          onClick={() => setPicked(null)}
          disabled={busy}
          className="mb-4 inline-flex items-center gap-1.5 text-[13px] lowercase text-black/40 transition hover:text-black disabled:opacity-40"
        >
          <ArrowLeft size={13} strokeWidth={1.5} />
          {t("fund.back")}
        </button>

        <p className="text-center text-[2.6rem] font-light leading-none tracking-[-0.03em] text-black">
          <span className={amount === "" ? "text-black/25" : "text-black/45"}>$</span>
          <AnimatedAmount value={amount} />
        </p>
        <p className="mt-2 flex items-center justify-center gap-2 text-[12px] text-black/45">
          <Icon item={picked} size={20} />
          {t("convert.available", { value: `$${formatUsdAmount(available)}`, sym: picked.symbol })}
        </p>

        <div className="mt-4 flex gap-1.5">
          {FRACTIONS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setAmount((available * f).toFixed(2))}
              className="flex-1 rounded-full border border-black/15 py-1.5 text-[11px] lowercase tracking-wide text-black/55 transition hover:border-black/40 hover:text-black"
            >
              {f === 1 ? t("rail.max") : `${f * 100}%`}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <AmountKeypad value={amount} onChange={setAmount} />
        </div>

        <button
          type="button"
          onClick={run}
          disabled={!ready || busy}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3.5 text-[14px] lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-25"
        >
          {busy && <Loader2 size={14} className="animate-spin" />}
          {t("convert.action", { sym: picked.symbol })}
        </button>

        <p className="mt-3 text-center text-[11px] leading-snug text-black/40">{t("convert.rate")}</p>
        {error && <p className="mt-3 text-center text-xs text-red-500">{localizeError(error, t)}</p>}
      </>
    );
  }

  return (
    <>
      <p className="mb-3 text-[13px] leading-snug text-black/50">{t("convert.hint")}</p>

      {items.length === 0 ? (
        <p className="text-[13px] leading-snug text-black/50">{t("convert.nothing")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <SheetRow
              key={item.key}
              leading={<Icon item={item} size={40} />}
              title={item.symbol}
              body={item.detail}
              badge={item.kind === "position" ? t("convert.position") : undefined}
              trailing={
                <span className="shrink-0 text-[14px] tabular-nums text-black">
                  ${formatUsdAmount(item.usd)}
                </span>
              }
              onClick={() => {
                setPicked(item);
                setAmount("");
                setError(null);
              }}
            />
          ))}
        </div>
      )}
    </>
  );
}

/** A coin wears its token logo; a position wears the source's. */
function Icon({ item, size }: { item: Cashable; size: number }) {
  const cls = size >= 40 ? "h-10 w-10 shrink-0 rounded-full" : "h-5 w-5 shrink-0 rounded-full";
  return item.kind === "coin" ? (
    <TokenIcon asset={item.asset} className={cls} />
  ) : (
    <AssetIcon src={item.logo} label={item.symbol} size={size} className="shrink-0" />
  );
}
