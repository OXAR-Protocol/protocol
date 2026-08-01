"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Clock } from "lucide-react";

import { CashOutFlow } from "@/components/cash-out-flow";
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-no-pull
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-full w-full max-w-[440px] overflow-y-auto rounded-[12px] border border-black/15 bg-white p-6 md:p-7"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">
              {live ? t("cashout.labelLive") : t("cashout.label")}
            </p>
            <h2 className="mt-1 text-xl text-black">{t("cashout.title")}</h2>
          </div>
          <button onClick={onClose} className="text-black/45 transition hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {live ? <CashOutFlow usdc={usdcValue} /> : <ComingSoon usdcValue={usdcValue} onClose={onClose} />}
      </motion.div>
    </motion.div>,
    document.body,
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
