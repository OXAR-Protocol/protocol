"use client";

import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";

import { useT } from "@/lib/i18n";

/**
 * The last screen before money leaves for good.
 *
 * Sending is the only irreversible act in the app: a wrong address or the wrong
 * network and there is no one to ask for it back. Everything else here can be
 * undone by doing the opposite trade. So the send gets what the rest doesn't — a
 * stop, with the three facts that decide it (how much, where, which network) large
 * enough to actually read, and the warnings that name how people lose money.
 */
export function SendReview({
  amount,
  symbol,
  to,
  chainLabel,
  isEvm,
  busy,
  onBack,
  onConfirm,
}: {
  amount: string;
  symbol: string;
  to: string;
  chainLabel: string;
  /** EVM addresses look identical on every chain — the warning differs. */
  isEvm: boolean;
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const { t } = useT();

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        disabled={busy}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] lowercase text-black/40 transition hover:text-black disabled:opacity-40"
      >
        <ArrowLeft size={13} strokeWidth={1.5} />
        {t("fund.back")}
      </button>

      <p className="text-[11px] lowercase tracking-wide text-black/40">{t("send.review.sending")}</p>
      <p className="mt-1 text-[2rem] font-light leading-none tracking-[-0.02em] text-black tabular-nums">
        {amount} <span className="text-[1.2rem] text-black/45">{symbol}</span>
      </p>

      <div className="mt-5 space-y-3 rounded-[10px] border border-black/10 p-4">
        <Row label={t("send.review.to")} value={to} mono />
        <Row label={t("send.review.network")} value={chainLabel} />
      </div>

      {/* Amber, not red: nothing has gone wrong yet — this is the moment to check. */}
      <div className="mt-4 rounded-[10px] border border-[#a35b00]/30 bg-[#a35b00]/[0.04] p-4">
        <p className="flex items-start gap-2 text-[12px] leading-snug text-[#a35b00]">
          <AlertTriangle size={13} strokeWidth={1.5} className="mt-px shrink-0" />
          <span>
            {t("send.review.warnOwn")}
            <br />
            {isEvm
              ? t("send.review.warnEvm", { chain: chainLabel })
              : t("send.review.warnSolana", { sym: symbol })}
            <br />
            {t("send.review.warnFinal")}
          </span>
        </p>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={busy}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3.5 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-25"
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={14} /> {t("send.sending")}
          </>
        ) : (
          t("send.review.confirm")
        )}
      </button>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="shrink-0 text-[11px] lowercase tracking-wide text-black/40">{label}</span>
      <span className={`min-w-0 break-all text-right text-[13px] text-black/80 ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
