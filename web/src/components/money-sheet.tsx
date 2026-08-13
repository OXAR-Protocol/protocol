"use client";

import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowUpRight, Clock, Plus, Wallet } from "lucide-react";

import { formatUsdAmount } from "@oxar/sdk";

import { SheetShell } from "@/components/sheet-shell";
import { FundSheet } from "@/components/fund-sheet";
import { SendSheet } from "@/components/send-sheet";
import { WithdrawPicker } from "@/components/withdraw-picker";
import { CashOutSheet } from "@/components/cash-out-sheet";
import { getUsdcUi } from "@/hooks/use-card-topup";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useSolanaContext } from "@/providers/solana-provider";
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
  const { connection, walletAddress } = useSolanaContext();
  const { totalUsdc } = useAggregatePersonalBalance();
  const [free, setFree] = useState<number | null>(null);
  const [open, setOpen] = useState<Open>(null);

  useEffect(() => {
    if (!walletAddress) return;
    let cancelled = false;
    void getUsdcUi(connection, walletAddress).then((v) => {
      if (!cancelled) setFree(v);
    });
    return () => {
      cancelled = true;
    };
  }, [connection, walletAddress]);

  const row =
    "flex w-full items-center gap-3 rounded-[10px] border border-black/12 px-4 py-3.5 text-left transition hover:border-black/40";

  return (
    <>
      <SheetShell label={t("money.label")} title={t("money.title")} onClose={onClose}>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Figure label={t("money.free")} value={free} />
          <Figure label={t("money.working")} value={totalUsdc} />
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setOpen("fund")} className={row}>
            <Plus size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
            <Label title={t("money.fund.title")} body={t("money.fund.body")} />
          </button>

          <button type="button" onClick={() => setOpen("withdraw")} className={row}>
            <ArrowUpRight size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
            <Label title={t("money.withdraw.title")} body={t("money.withdraw.body")} />
          </button>
        </div>

        <p className="mt-5 flex items-center gap-2 text-[11px] text-black/40">
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
    <div className="rounded-[10px] border border-black/10 px-4 py-3">
      <p className="text-[11px] lowercase tracking-wide text-black/40">{label}</p>
      <p className="mt-0.5 text-[18px] tabular-nums text-black">
        {value === null ? "—" : `$${formatUsdAmount(value)}`}
      </p>
    </div>
  );
}

function Label({ title, body }: { title: string; body: string }) {
  return (
    <span className="min-w-0">
      <span className="block text-[14px] text-black">{title}</span>
      <span className="block text-[12px] leading-snug text-black/45">{body}</span>
    </span>
  );
}

/** Re-exported so the wallet icon has something to render beside the menu item. */
export const MoneyIcon = Wallet;
