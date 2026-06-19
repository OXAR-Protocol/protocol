"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, ExternalLink, ShieldCheck, Loader2 } from "lucide-react";

import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useSolanaContext } from "@/providers/solana-provider";
import { USDC_MINT } from "@/lib/constants";

const STEPS = [
  "enter the amount + verify (KYC)",
  "pick your card to receive the cash",
  "send your USDC to the address Transak shows",
];

/**
 * Cash out to a bank card via the Transak SELL widget. Asks our backend for a
 * single-use Secure Widget URL (Transak's mandated flow — secret stays server-side)
 * pre-filled for USDC on Solana, then opens it. Transak handles KYC, the card and
 * the payout — non-custodial, OXAR never touches card data.
 */
export function CashOutSheet({ onClose }: { onClose: () => void }) {
  const { assets } = useWalletAssets();
  const { walletAddress } = useSolanaContext();
  const usdc = assets.find((a) => a.mint === USDC_MINT);
  const usdcValue = usdc?.usdValue ?? 0;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/transak-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: walletAddress?.toBase58() }),
      });
      const json = (await res.json()) as { widgetUrl?: string; error?: string };
      if (!res.ok || !json.widgetUrl) throw new Error(json.error ?? "Couldn't start cash-out");
      window.open(json.widgetUrl, "_blank", "noopener,noreferrer");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start cash-out");
    } finally {
      setLoading(false);
    }
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

        {error && <p className="mt-4 text-center text-[12px] text-red-600">{error}</p>}

        <button
          onClick={go}
          disabled={loading}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-[14px] font-medium lowercase tracking-wide text-white transition hover:bg-black/85 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={14} /> opening…
            </>
          ) : (
            <>
              continue to transak <ExternalLink size={14} strokeWidth={1.5} />
            </>
          )}
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
