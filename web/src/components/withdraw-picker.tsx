"use client";

import { Building2, CreditCard, Wallet } from "lucide-react";

import { SheetShell } from "@/components/sheet-shell";
import { CASH_OUT_FEATURE } from "@/components/cash-out-sheet";
import { useFeature } from "@/hooks/use-features";
import { useT } from "@/lib/i18n";

/**
 * Where the money is going out to.
 *
 * Three ways, and the honest state of each: a wallet works today; a card works
 * through a licensed provider; a bank account doesn't, because it needs a company
 * we don't have yet — so it says "soon" rather than pretending.
 *
 * No provider is named here. On the way IN the name matters (it's who takes the
 * payment and might decline it); on the way out it's plumbing, and a name the
 * person has never heard of reads as a stranger being handed their money.
 */
export function WithdrawPicker({
  onClose,
  onWallet,
  onCard,
}: {
  onClose: () => void;
  onWallet: () => void;
  onCard: () => void;
}) {
  const { t } = useT();
  const cardLive = useFeature(CASH_OUT_FEATURE);

  const row =
    "flex w-full items-center gap-3 rounded-[10px] border border-black/12 px-4 py-3.5 text-left transition hover:border-black/40";

  return (
    <SheetShell label={t("withdraw.label")} title={t("withdraw.title")} onClose={onClose}>
      <div className="flex flex-col gap-2">
        <button type="button" onClick={onWallet} className={row}>
          <Wallet size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
          <span className="min-w-0">
            <span className="block text-[14px] text-black">{t("withdraw.wallet.title")}</span>
            <span className="block text-[12px] leading-snug text-black/45">
              {t("withdraw.wallet.body")}
            </span>
          </span>
        </button>

        <button type="button" onClick={onCard} className={row}>
          <CreditCard size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
          <span className="min-w-0">
            <span className="block text-[14px] text-black">{t("withdraw.card.title")}</span>
            <span className="block text-[12px] leading-snug text-black/45">
              {t("withdraw.card.body")}
            </span>
          </span>
          {!cardLive && (
            <span className="ml-auto shrink-0 rounded-full bg-black/[0.06] px-2 py-0.5 text-[9px] lowercase tracking-wide text-black/45">
              {t("common.soon")}
            </span>
          )}
        </button>

        {/* Not a button: there is nothing behind it yet, and a control that opens
            nothing is worse than a line that says so. */}
        <div className={`${row} cursor-default opacity-60 hover:border-black/12`}>
          <Building2 size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
          <span className="min-w-0">
            <span className="block text-[14px] text-black">{t("withdraw.bank.title")}</span>
            <span className="block text-[12px] leading-snug text-black/45">
              {t("withdraw.bank.body")}
            </span>
          </span>
          <span className="ml-auto shrink-0 rounded-full bg-black/[0.06] px-2 py-0.5 text-[9px] lowercase tracking-wide text-black/45">
            {t("common.soon")}
          </span>
        </div>
      </div>
    </SheetShell>
  );
}
