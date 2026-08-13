"use client";

import { CreditCard, Landmark, Wallet } from "lucide-react";

import { SheetShell } from "@/components/sheet-shell";
import { SheetRow } from "@/components/sheet-row";
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

  return (
    <SheetShell label={t("withdraw.label")} title={t("withdraw.title")} onClose={onClose}>
      <div className="flex flex-col gap-2">
        <SheetRow
          icon={Wallet}
          title={t("withdraw.wallet.title")}
          body={t("withdraw.wallet.body")}
          onClick={onWallet}
        />
        <SheetRow
          icon={CreditCard}
          title={t("withdraw.card.title")}
          body={t("withdraw.card.body")}
          badge={cardLive ? undefined : t("common.soon")}
          onClick={onCard}
        />
        {/* No onClick: there is nothing behind it yet, and a control that opens
            nothing is worse than a line that says so. */}
        <SheetRow
          icon={Landmark}
          title={t("withdraw.bank.title")}
          body={t("withdraw.bank.body")}
          badge={t("common.soon")}
        />
      </div>
    </SheetShell>
  );
}
