"use client";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

import { useT } from "@/lib/i18n";

/**
 * It's gone, and that's a good thing.
 *
 * The screen said "Sent ✓" twice — once as the sheet's title, once as its whole
 * body — over an otherwise empty white panel. A send is the most irreversible act
 * in the app; the moment it lands deserves the same handshake a purchase gets, and
 * the figure it moved.
 */
export function SendSent({
  amount,
  symbol,
  to,
  chainLabel,
  crossChain,
  signature,
}: {
  amount: string;
  symbol: string;
  to: string;
  chainLabel: string;
  /** Still bridging: it left here, it lands over there in a minute or two. */
  crossChain: boolean;
  signature: string;
}) {
  const { t } = useT();
  const short = `${to.slice(0, 6)}…${to.slice(-6)}`;

  return (
    <div className="pb-2 text-center">
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 220 }}
        className="flex justify-center"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/art/handshake-cut.webp" alt="" className="h-28 w-auto select-none md:h-32" />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <p className="mt-4 text-[10px] lowercase tracking-[0.2em] text-black/40">{t("send.sent")}</p>
        <p className="mt-2 text-[36px] font-medium leading-none tracking-[-0.02em] tabular-nums text-black">
          {amount} <span className="text-[20px] text-black/45">{symbol}</span>
        </p>

        <p className="mt-3 text-[13px] leading-snug text-black/50">
          {t("send.sentTo", { address: short, chain: chainLabel })}
        </p>
        {crossChain && (
          <p className="mt-1 text-[11px] text-black/40">{t("send.arriving", { chain: chainLabel })}</p>
        )}

        <a
          href={`https://solscan.io/tx/${signature}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#3c05c7] hover:underline"
        >
          {t("send.viewSolscan")} <ExternalLink size={12} strokeWidth={1.5} />
        </a>
      </motion.div>
    </div>
  );
}
