"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowDownToLine, ArrowUpFromLine, Clock } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { SheetShell } from "@/components/sheet-shell";
import { SheetRow } from "@/components/sheet-row";
import { FundSheet } from "@/components/fund-sheet";
import { SendSheet } from "@/components/send-sheet";
import { WithdrawPicker } from "@/components/withdraw-picker";
import { CashOutSheet } from "@/components/cash-out-sheet";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useT } from "@/lib/i18n";

type Open = null | "fund" | "withdraw" | "send" | "cashout";

/**
 * Everything you can do with money, in one place.
 *
 * It was spread across the wallet menu and a button beside the balance, so "where
 * do I get money out" had no single answer. Two figures at the top, because they
 * answer different questions: what is free to act on right now, and what is already
 * working.
 *
 * Note what ISN'T here: fomo separates "withdraw" from "send" because a withdrawal
 * leaves their books while a send stays inside them. Non-custodial, both are the
 * same act — money leaving your wallet for an address — so there is one door, and
 * inside it a choice of where to.
 */
export function MoneySheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const { totalUsdc } = useAggregatePersonalBalance();
  const { usd: free } = useUsdcBalance();
  const [open, setOpen] = useState<Open>(null);

  return (
    <>
      <SheetShell label={t("money.label")} title={t("money.title")} onClose={onClose}>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Figure label={t("money.free")} value={free} />
          <Figure label={t("money.working")} value={totalUsdc} />
        </div>

        <div className="flex flex-col gap-2">
          <SheetRow
            icon={ArrowDownToLine}
            title={t("money.fund.title")}
            body={t("money.fund.body")}
            onClick={() => setOpen("fund")}
          />
          <SheetRow
            icon={ArrowUpFromLine}
            title={t("money.withdraw.title")}
            body={t("money.withdraw.body")}
            onClick={() => setOpen("withdraw")}
          />
        </div>

        <p className="mt-5 flex items-center gap-2 text-[11px] text-ink/40">
          <Clock size={12} strokeWidth={1.5} />
          {t("money.history")}
        </p>
      </SheetShell>

      <AnimatePresence>
        {open === "fund" && <FundSheet onClose={() => setOpen(null)} />}
        {open === "withdraw" && (
          <WithdrawPicker
            onClose={() => setOpen(null)}
            onWallet={() => setOpen("send")}
            onCard={() => setOpen("cashout")}
          />
        )}
        {open === "send" && <SendSheet onClose={() => setOpen(null)} />}
        {open === "cashout" && <CashOutSheet onClose={() => setOpen(null)} />}
      </AnimatePresence>
    </>
  );
}

/** One of the two figures — dashes while it's being read, never a false zero. */
function Figure({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="rounded-control border border-ink/10 px-4 py-3">
      <p className="text-[11px] lowercase tracking-wide text-ink/40">{label}</p>
      <p className="mt-0.5 text-[18px] tabular-nums text-ink">
        {value === null ? "—" : `$${formatUsdAmount(value)}`}
      </p>
    </div>
  );
}

