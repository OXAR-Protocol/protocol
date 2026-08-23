"use client";

import { Loader2, TriangleAlert } from "lucide-react";

import { PAYBIS_FEE_WARN_FRACTION, PAYBIS_FIATS, type PaybisFiat, type PaybisQuote } from "@oxar/sdk";

import { useT } from "@/lib/i18n";

export const money = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Amount, currency, and what Paybis will actually give you for it.
 *
 * The quote is the whole reason this exists: their fee has a fixed floor, so it is
 * brutal on small orders and cheap on real ones, and nobody should find that out
 * after the money has moved.
 */
export function PaybisAmount({
  amount,
  onAmount,
  unit,
  max,
  fiat,
  onFiat,
  quote,
  loading,
  error,
}: {
  amount: string;
  onAmount: (v: string) => void;
  /** What the number in the box means — "USDC" when selling, the fiat when buying. */
  unit: string;
  /** Shown as a "max" shortcut; omitted when spending fiat we can't know about. */
  max?: number;
  fiat: PaybisFiat;
  onFiat: (f: PaybisFiat) => void;
  quote: PaybisQuote | null;
  loading: boolean;
  error: string | null;
}) {
  const { t } = useT();
  const pricey = quote !== null && quote.feeFraction > PAYBIS_FEE_WARN_FRACTION;

  return (
    <>
      <div className="rounded-control border border-ink/10 px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-[11px] lowercase tracking-wide text-ink/40">{t("cashout.amount")}</label>
          {max !== undefined && (
            <button
              onClick={() => onAmount(String(Math.floor(max)))}
              className="text-[11px] lowercase text-ink/40 transition hover:text-ink"
            >
              {t("cashout.max", { amount: money(max) })}
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            value={amount}
            onChange={(e) => onAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-[20px] tabular-nums text-ink outline-none placeholder:text-ink/25"
          />
          <span className="text-[13px] text-ink/40">{unit}</span>
        </div>
      </div>

      <div className="mt-2 flex gap-1.5">
        {PAYBIS_FIATS.map((f) => (
          <button
            key={f}
            onClick={() => onFiat(f)}
            className={`rounded-full border px-3 py-1 text-[12px] transition ${
              f === fiat ? "border-ink/70 text-ink" : "border-ink/15 text-ink/45 hover:border-ink/35"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-[58px] rounded-control border border-ink/10 bg-ink/[0.02] px-4 py-3">
        {loading && !quote ? (
          <Loader2 size={15} strokeWidth={1.5} className="animate-spin text-ink/30" />
        ) : quote ? (
          <>
            <p className="text-[11px] lowercase tracking-wide text-ink/40">{t("cashout.youGet")}</p>
            <p className="mt-0.5 text-[18px] tabular-nums text-ink">
              ≈ {money(quote.receive)} {quote.receiveCurrency}
            </p>
            <p className="mt-0.5 text-[11px] tabular-nums text-ink/45">
              {t("cashout.fee", {
                fee: `${money(quote.fee)} ${quote.feeCurrency}`,
                pct: (quote.feeFraction * 100).toFixed(1),
              })}
            </p>
          </>
        ) : (
          <p className="text-[12px] text-ink/40">{error ?? t("cashout.enterAmount")}</p>
        )}
      </div>

      {pricey && (
        <div className="mt-2 flex items-start gap-2 rounded-control border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5">
          <TriangleAlert size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[12px] leading-snug text-ink/65">{t("cashout.pricey")}</p>
        </div>
      )}
    </>
  );
}
