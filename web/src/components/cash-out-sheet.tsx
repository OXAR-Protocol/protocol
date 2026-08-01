"use client";

import { Clock } from "lucide-react";

import { CashOutFlow } from "@/components/cash-out-flow";
import { PaybisSheet } from "@/components/paybis-sheet";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useFeature } from "@/hooks/use-features";
import { USDC_MINT } from "@/lib/constants";
import { useT } from "@/lib/i18n";

/** Feature key for the Paybis cash-out. Dark until the pilot has run for real. */
export const CASH_OUT_FEATURE = "paybis-cashout";

/**
 * Cash out to a bank card. Behind the flag this is the live Paybis hand-off; without
 * it the sheet keeps saying "soon" and points at Send, because paying out fiat
 * ourselves would need an entity and a licence we do not have.
 */
export function CashOutSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const { assets } = useWalletAssets();
  const live = useFeature(CASH_OUT_FEATURE);
  const usdcValue = assets.find((a) => a.mint === USDC_MINT)?.usdValue ?? 0;

  return (
    <PaybisSheet
      label={live ? t("cashout.labelLive") : t("cashout.label")}
      title={t("cashout.title")}
      onClose={onClose}
    >
      {live ? <CashOutFlow usdc={usdcValue} /> : <ComingSoon usdcValue={usdcValue} onClose={onClose} />}
    </PaybisSheet>
  );
}

/** Pre-flag state: explain the gap honestly and point at the exit that does work. */
function ComingSoon({ usdcValue, onClose }: { usdcValue: number; onClose: () => void }) {
  const { t } = useT();
  return (
    <>
      <div className="flex items-start gap-3 rounded-[10px] border border-[#3c05c7]/25 bg-[#3c05c7]/[0.04] px-4 py-3">
        <Clock size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#3c05c7]" />
        <p className="text-[13px] leading-snug text-black/70">
          {t("cashout.body1a")}<span className="text-black">{t("cashout.body1b")}</span>{t("cashout.body1c")}
        </p>
      </div>

      <p className="mt-4 text-[13px] leading-snug text-black/55">
        {t("cashout.body2a")}<span className="text-black">{t("cashout.body2b")}</span>{t("cashout.body2c")}
      </p>

      <div className="mt-4 rounded-[10px] border border-black/10 px-4 py-3">
        <p className="text-[11px] lowercase tracking-wide text-black/40">{t("cashout.yourUsdc")}</p>
        <p className="mt-0.5 text-[18px] tabular-nums text-black">${usdcValue.toFixed(2)}</p>
      </div>

      <button
        onClick={onClose}
        className="mt-5 w-full rounded-full bg-black px-4 py-3 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85"
      >
        {t("cashout.gotIt")}
      </button>
    </>
  );
}
