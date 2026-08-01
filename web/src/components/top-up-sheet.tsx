"use client";

import { useState } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";

import { paybisBuyUrl, type PaybisFiat } from "@oxar/sdk";

import { PaybisSheet } from "@/components/paybis-sheet";
import { PaybisAmount } from "@/components/paybis-amount";
import { PaybisSteps, type PaybisStep } from "@/components/paybis-steps";
import { usePaybisQuote } from "@/hooks/use-paybis-quote";
import { useSolanaContext } from "@/providers/solana-provider";
import { useT } from "@/lib/i18n";

/** Feature key for the Paybis top-up. Shares the cash-out pilot's audience. */
export const TOP_UP_FEATURE = "paybis-topup";

const STEPS: readonly PaybisStep[] = [
  { title: "topup.s1.title", body: "topup.s1.body", shot: "01-form" },
  { title: "topup.s2.title", body: "topup.s2.body", shot: "02-wallet" },
  { title: "topup.s3.title", body: "topup.s3.body", shot: "03-myself" },
  { title: "topup.s4.title", body: "topup.s4.body", shot: "04-personal" },
  { title: "topup.s5.title", body: "topup.s5.body" },
];

/**
 * Top up with a card through Paybis, for people the built-in on-ramp can't serve —
 * MoonPay excludes Ukraine outright.
 *
 * Ukrainian cards are a separate problem we have not solved: monobank declines the
 * charge under an NBU quasi-cash restriction, and that is the issuing bank, not
 * Paybis. So this is honest about needing a card from elsewhere.
 *
 * Their buy page does take currency and amount in the URL, but NOT the wallet
 * address — that has to be pasted by hand, which is why copying it is a step of its
 * own rather than a line in the instructions.
 */
export function TopUpSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const { walletAddress } = useSolanaContext();
  const [fiat, setFiat] = useState<PaybisFiat>("EUR");
  const [amount, setAmount] = useState("100");
  const [copied, setCopied] = useState(false);

  const address = walletAddress?.toBase58() ?? "";
  const { quote, loading, error } = usePaybisQuote("buy", Number(amount), fiat);

  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <PaybisSheet label={t("topup.label")} title={t("topup.title")} onClose={onClose}>
      <PaybisAmount
        amount={amount}
        onAmount={setAmount}
        unit={fiat}
        fiat={fiat}
        onFiat={setFiat}
        quote={quote}
        loading={loading}
        error={error}
      />

      <div className="mt-3 rounded-[10px] border border-[#3c05c7]/25 bg-[#3c05c7]/[0.04] px-4 py-3">
        <p className="text-[12px] leading-snug text-black/65">{t("topup.uaWarning")}</p>
      </div>

      <button
        onClick={copy}
        disabled={!address}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-[10px] border border-black/15 px-4 py-3 text-left transition hover:border-black/40 disabled:opacity-50"
      >
        <span className="min-w-0">
          <span className="block text-[11px] lowercase tracking-wide text-black/40">{t("topup.yourAddress")}</span>
          <span className="block truncate text-[13px] text-black/80">{address || "…"}</span>
        </span>
        {copied ? (
          <Check size={15} strokeWidth={1.5} className="shrink-0 text-[#3c05c7]" />
        ) : (
          <Copy size={15} strokeWidth={1.5} className="shrink-0 text-black/40" />
        )}
      </button>

      <p className="mt-5 text-[11px] lowercase tracking-[0.18em] text-black/35">{t("cashout.how")}</p>
      <PaybisSteps dir="topup" steps={STEPS} />

      <a
        href={paybisBuyUrl(fiat, Number(amount) > 0 ? Number(amount) : undefined)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85"
      >
        {t("topup.open")}
        <ExternalLink size={14} strokeWidth={1.5} />
      </a>

      <p className="mt-3 text-[11px] leading-snug text-black/40">{t("topup.disclaimer")}</p>
    </PaybisSheet>
  );
}
