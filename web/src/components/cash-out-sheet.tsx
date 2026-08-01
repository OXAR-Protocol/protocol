"use client";

import { CashOutFlow } from "@/components/cash-out-flow";
import { PaybisSheet } from "@/components/paybis-sheet";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { USDC_MINT } from "@/lib/constants";
import { useT } from "@/lib/i18n";

/**
 * Cash out to a bank card, through Paybis. They are the counterparty — their
 * licence, their KYC, their payout — so we quote, explain, and hand over. Paying out
 * fiat ourselves would need an entity and a licence we do not have.
 */
export function CashOutSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const { assets } = useWalletAssets();
  const usdcValue = assets.find((a) => a.mint === USDC_MINT)?.usdValue ?? 0;

  return (
    <PaybisSheet label={t("cashout.labelLive")} title={t("cashout.title")} onClose={onClose}>
      <CashOutFlow usdc={usdcValue} />
    </PaybisSheet>
  );
}
