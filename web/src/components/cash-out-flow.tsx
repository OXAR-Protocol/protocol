"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ExternalLink, ArrowUpRight } from "lucide-react";

import { paybisSellUrl, type PaybisFiat } from "@oxar/sdk";

import { PaybisAmount } from "@/components/paybis-amount";
import { PaybisSteps, type PaybisStep } from "@/components/paybis-steps";
import { SendSheet } from "@/components/send-sheet";
import { usePaybisQuote } from "@/hooks/use-paybis-quote";
import { useT } from "@/lib/i18n";

const STEPS: readonly PaybisStep[] = [
  { title: "cashout.s1.title", body: "cashout.s1.body", shot: "01-form" },
  { title: "cashout.s2.title", body: "cashout.s2.body", shot: "02-originator" },
  { title: "cashout.s3.title", body: "cashout.s3.body", shot: "03-source" },
  { title: "cashout.s4.title", body: "cashout.s4.body" },
  { title: "cashout.s5.title", body: "cashout.s5.body", shot: "04-address" },
  { title: "cashout.s6.title", body: "cashout.s6.body" },
];

/**
 * Cash out through Paybis. They are the counterparty — their licence, their KYC,
 * their payout — so we quote, explain, and hand over. Selling goes over Base because
 * their Solana USDC is buy-only, which is why Send opens preselected to Base.
 */
export function CashOutFlow({ usdc }: { usdc: number }) {
  const { t } = useT();
  const [fiat, setFiat] = useState<PaybisFiat>("UAH");
  const [amount, setAmount] = useState(usdc >= 1 ? String(Math.floor(usdc)) : "");
  const [showSend, setShowSend] = useState(false);

  const { quote, loading, error } = usePaybisQuote("sell", Number(amount), fiat);

  return (
    <>
      <PaybisAmount
        amount={amount}
        onAmount={setAmount}
        unit="USDC"
        max={usdc}
        fiat={fiat}
        onFiat={setFiat}
        quote={quote}
        loading={loading}
        error={error}
      />

      <p className="mt-5 text-[11px] lowercase tracking-[0.18em] text-ink/35">{t("cashout.how")}</p>
      <PaybisSteps dir="cashout" steps={STEPS} />

      <a
        href={paybisSellUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-ink px-4 py-3 text-[14px] font-medium lowercase tracking-wide text-paper transition active:scale-[0.97] hover:bg-ink/85"
      >
        {t("cashout.open")}
        <ExternalLink size={14} strokeWidth={1.5} />
      </a>

      <button
        onClick={() => setShowSend(true)}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 px-4 py-3 text-[14px] lowercase tracking-wide text-ink/70 transition hover:border-ink/40 hover:text-ink"
      >
        {t("cashout.haveAddress")}
        <ArrowUpRight size={14} strokeWidth={1.5} />
      </button>

      <p className="mt-3 text-[11px] leading-snug text-ink/40">{t("cashout.disclaimer")}</p>

      <AnimatePresence>
        {showSend && <SendSheet initialDestKey="base" onClose={() => setShowSend(false)} />}
      </AnimatePresence>
    </>
  );
}
