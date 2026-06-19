"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Clock } from "lucide-react";

import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { USDC_MINT } from "@/lib/constants";

/**
 * Cash out to a bank card — COMING SOON. Direct card payout needs a licensed
 * provider (Transak) with KYB/an entity, which isn't live yet. Until then the
 * sheet explains the status and points users at withdrawing to an account they
 * already control (via Send). The Transak server route stays wired for when the
 * partner account is approved — see /api/transak-session.
 */
export function CashOutSheet({ onClose }: { onClose: () => void }) {
  const { assets } = useWalletAssets();
  const usdc = assets.find((a) => a.mint === USDC_MINT);
  const usdcValue = usdc?.usdValue ?? 0;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-white/70 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] rounded-[12px] border border-black/15 bg-white p-6 md:p-7"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">cash out · coming soon</p>
            <h2 className="mt-1 text-xl text-black">Cash out to your card</h2>
          </div>
          <button onClick={onClose} className="text-black/45 transition hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-[10px] border border-[#3c05c7]/25 bg-[#3c05c7]/[0.04] px-4 py-3">
          <Clock size={16} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#3c05c7]" />
          <p className="text-[13px] leading-snug text-black/70">
            Direct card payout is <span className="text-black">coming soon</span> — we&apos;re finishing the
            licensed off-ramp so you can sell straight to a Visa / Mastercard, in minutes.
          </p>
        </div>

        <p className="mt-4 text-[13px] leading-snug text-black/55">
          In the meantime you can withdraw your USDC to any wallet or exchange you already use (Binance,
          Revolut, etc.) with <span className="text-black">Send</span>, and cash out from there — your funds,
          your keys, anytime.
        </p>

        <div className="mt-4 rounded-[10px] border border-black/10 px-4 py-3">
          <p className="text-[11px] lowercase tracking-wide text-black/40">your USDC</p>
          <p className="mt-0.5 text-[18px] tabular-nums text-black">${usdcValue.toFixed(2)}</p>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-black px-4 py-3 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85"
        >
          got it
        </button>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
