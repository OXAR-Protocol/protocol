"use client";

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ExternalLink, ShieldCheck } from "lucide-react";

import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useSolanaContext } from "@/providers/solana-provider";
import { USDC_MINT } from "@/lib/constants";
import { offrampConfigured, transakSellUrl } from "@/lib/offramp/sell-redirect";

const STEPS = [
  "enter the amount + verify (KYC)",
  "pick your card to receive the cash",
  "send your USDC to the address Transak shows",
];

/**
 * Cash out to a bank card via the Transak SELL widget. Shows the wallet's USDC and
 * opens Transak pre-filled (USDC · Solana · your address) — Transak handles KYC,
 * the card and the payout (we never touch card data). Gated by the Transak apiKey.
 */
export function CashOutSheet({ onClose }: { onClose: () => void }) {
  const { assets } = useWalletAssets();
  const { walletAddress } = useSolanaContext();
  const usdc = assets.find((a) => a.mint === USDC_MINT);
  const usdcValue = usdc?.usdValue ?? 0;

  const url = transakSellUrl({ walletAddress: walletAddress?.toBase58() });
  const ready = offrampConfigured() && !!url;

  const go = () => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

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
            <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">off-ramp · transak</p>
            <h2 className="mt-1 text-xl text-black">Cash out to your card</h2>
          </div>
          <button onClick={onClose} className="text-black/45 transition hover:text-black">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-[14px] leading-snug text-black/70">
          Sell your USDC for cash straight to your Visa / Mastercard via{" "}
          <span className="text-black">Transak</span> — licensed, non-custodial, lands in minutes.
        </p>

        <div className="mt-4 rounded-[10px] border border-black/10 px-4 py-3">
          <p className="text-[11px] lowercase tracking-wide text-black/40">your USDC</p>
          <p className="mt-0.5 text-[18px] tabular-nums text-black">${usdcValue.toFixed(2)}</p>
          {usdcValue < 1 && (
            <p className="mt-1 text-[11px] text-black/45">sell a position to USDC first, then cash out.</p>
          )}
        </div>

        <ol className="mt-4 space-y-1.5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex gap-2 text-[13px] text-black/60">
              <span className="text-black/30">{i + 1}.</span>
              {s}
            </li>
          ))}
        </ol>

        <button
          onClick={go}
          disabled={!ready}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-40"
        >
          {ready ? "continue to transak" : "cash-out is being set up"}
          {ready && <ExternalLink size={14} strokeWidth={1.5} />}
        </button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-black/40">
          <ShieldCheck size={12} strokeWidth={1.5} />
          Transak handles the card &amp; ID check — OXAR never sees your card.
        </p>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
