"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ExternalLink, ArrowUpRight, TriangleAlert, Loader2 } from "lucide-react";

import { PAYBIS_FEE_WARN_FRACTION, PAYBIS_FIATS, paybisSellUrl, type PaybisFiat } from "@oxar/sdk";

import { CashOutSteps } from "@/components/cash-out-steps";
import { SendSheet } from "@/components/send-sheet";
import { usePaybisQuote } from "@/hooks/use-paybis-quote";
import { useT } from "@/lib/i18n";

const money = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Cash out through Paybis. They are the counterparty — their licence, their KYC,
 * their payout — so we quote, explain, and hand over. The quote is the point: their
 * fee is mostly flat, so it is brutal on small amounts and cheap on real ones, and
 * nobody should discover that after the money has gone.
 */
export function CashOutFlow({ usdc }: { usdc: number }) {
  const { t } = useT();
  const [fiat, setFiat] = useState<PaybisFiat>("UAH");
  const [amount, setAmount] = useState(usdc >= 1 ? String(Math.floor(usdc)) : "");
  const [showSend, setShowSend] = useState(false);

  const { quote, loading, error } = usePaybisQuote(Number(amount), fiat);
  const pricey = quote !== null && quote.feeFraction > PAYBIS_FEE_WARN_FRACTION;

  return (
    <>
      <div className="rounded-[10px] border border-black/10 px-4 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-[11px] lowercase tracking-wide text-black/40">{t("cashout.amount")}</label>
          <button
            onClick={() => setAmount(String(Math.floor(usdc)))}
            className="text-[11px] lowercase text-black/40 transition hover:text-black"
          >
            {t("cashout.max", { amount: money(usdc) })}
          </button>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="0"
            className="min-w-0 flex-1 bg-transparent text-[20px] tabular-nums text-black outline-none placeholder:text-black/25"
          />
          <span className="text-[13px] text-black/40">USDC</span>
        </div>
      </div>

      <div className="mt-2 flex gap-1.5">
        {PAYBIS_FIATS.map((f) => (
          <button
            key={f}
            onClick={() => setFiat(f)}
            className={`rounded-full border px-3 py-1 text-[12px] transition ${
              f === fiat ? "border-black/70 text-black" : "border-black/15 text-black/45 hover:border-black/35"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-3 min-h-[58px] rounded-[10px] border border-black/10 bg-black/[0.02] px-4 py-3">
        {loading && !quote ? (
          <Loader2 size={15} strokeWidth={1.5} className="animate-spin text-black/30" />
        ) : quote ? (
          <>
            <p className="text-[11px] lowercase tracking-wide text-black/40">{t("cashout.youGet")}</p>
            <p className="mt-0.5 text-[18px] tabular-nums text-black">
              ≈ {money(quote.receive)} {quote.currency}
            </p>
            <p className="mt-0.5 text-[11px] tabular-nums text-black/45">
              {t("cashout.fee", {
                fee: `${money(quote.fee)} ${quote.currency}`,
                pct: (quote.feeFraction * 100).toFixed(1),
              })}
            </p>
          </>
        ) : (
          <p className="text-[12px] text-black/40">{error ?? t("cashout.enterAmount")}</p>
        )}
      </div>

      {pricey && (
        <div className="mt-2 flex items-start gap-2 rounded-[10px] border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2.5">
          <TriangleAlert size={14} strokeWidth={1.5} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-[12px] leading-snug text-black/65">{t("cashout.pricey")}</p>
        </div>
      )}

      <p className="mt-5 text-[11px] lowercase tracking-[0.18em] text-black/35">{t("cashout.how")}</p>
      <CashOutSteps />

      <a
        href={paybisSellUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85"
      >
        {t("cashout.open")}
        <ExternalLink size={14} strokeWidth={1.5} />
      </a>

      <button
        onClick={() => setShowSend(true)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-black/15 px-4 py-3 text-[14px] lowercase tracking-wide text-black/70 transition hover:border-black/40 hover:text-black"
      >
        {t("cashout.haveAddress")}
        <ArrowUpRight size={14} strokeWidth={1.5} />
      </button>

      <p className="mt-3 text-[11px] leading-snug text-black/40">{t("cashout.disclaimer")}</p>

      <AnimatePresence>
        {showSend && <SendSheet initialDestKey="base" onClose={() => setShowSend(false)} />}
      </AnimatePresence>
    </>
  );
}
