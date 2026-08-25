"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";
import { AnimatePresence } from "framer-motion";
import { Copy, Check, LogOut, ChevronDown, KeyRound, MessageSquare, Wallet } from "lucide-react";

import { useSolanaContext } from "@/providers/solana-provider";
import { MetalAvatar } from "@/components/metal-avatar";
import { MoneySheet } from "@/components/money-sheet";
import { FeedbackSheet } from "@/components/feedback-sheet";
import { useSolanaName } from "@/hooks/use-solana-name";
import { useT } from "@/lib/i18n";

/**
 * Header wallet control: the active Solana address as a pill. The dropdown holds
 * the address to copy, the one door to everything money can do, the key export for
 * the built-in wallet, and the way out.
 */
export function WalletMenu() {
  const { user, logout } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const { exportWallet } = useExportWallet();
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [showMoney, setShowMoney] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const solana = walletAddress?.toBase58() ?? null;
  const shortSolana = solana ? `${solana.slice(0, 4)}…${solana.slice(-4)}` : "";
  // Prefer the wallet's .sol name (SNS) in the pill; fall back to the short address.
  const solName = useSolanaName(solana);
  // Export only applies to the built-in (embedded) wallet — externals you already control.
  // SAFETY: linkedAccounts is loosely typed by Privy; we read type/chainType/address/walletClientType.
  const isEmbedded = (user?.linkedAccounts ?? []).some(
    (a: any) =>
      a.type === "wallet" && a.chainType === "solana" && a.address === solana && a.walletClientType === "privy",
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!solana) {
    return (
      <span className="lowercase text-[14px] text-ink/40">{t("wallet.connecting")}</span>
    );
  }

  const item =
    "w-full flex items-center gap-2 px-3 py-2.5 lowercase text-[14px] text-ink/60 transition text-left";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-4 py-2 lowercase text-[14px] text-ink/70 transition-colors hover:border-ink/40 hover:text-ink"
      >
        {/* The app-icon material, at the one size where it is unambiguously
            decoration: a dot said "connected" and nothing else, and this says the
            same thing while looking like the product. It is not a control — the
            whole pill is. */}
        <MetalAvatar seed={solana ?? "you"} size={16} />
        {solName ?? shortSolana}
        <ChevronDown size={13} strokeWidth={1.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-card border border-ink/10 bg-paper shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <AddressRow label={t("you.wallet")} address={solana} />

          {/* One door for money instead of three items that each did a piece of it —
              in, out and across all live behind this now (see MoneySheet). */}
          <button
            onClick={() => { setOpen(false); setShowMoney(true); }}
            className={`${item} border-b border-ink/10 hover:bg-ink/[0.04] hover:text-ink`}
          >
            <Wallet size={13} strokeWidth={1.5} />
            {t("wallet.manageFunds")}
          </button>

          {isEmbedded && (
            <button
              onClick={() => { setOpen(false); void exportWallet({ address: solana }); }}
              className={`${item} border-b border-ink/10 hover:bg-ink/[0.04] hover:text-ink`}
            >
              <KeyRound size={13} strokeWidth={1.5} />
              {t("wallet.exportKey")}
            </button>
          )}

          <button
            onClick={() => { setOpen(false); setShowFeedback(true); }}
            className={`${item} border-b border-ink/10 hover:bg-ink/[0.04] hover:text-ink`}
          >
            <MessageSquare size={13} strokeWidth={1.5} />
            {t("wallet.feedback")}
          </button>

          <button
            onClick={() => { setOpen(false); logout(); }}
            className={`${item} hover:bg-ink/[0.04] hover:text-loss`}
          >
            <LogOut size={13} strokeWidth={1.5} />
            {t("wallet.disconnect")}
          </button>
        </div>
      )}

      <AnimatePresence>{showMoney && <MoneySheet onClose={() => setShowMoney(false)} />}</AnimatePresence>
      <AnimatePresence>{showFeedback && <FeedbackSheet onClose={() => setShowFeedback(false)} />}</AnimatePresence>
    </div>
  );
}

/** One copyable address line. */
function AddressRow({ label, address }: { label: string; address: string }) {
  const [copied, setCopied] = useState(false);
  const short = `${address.slice(0, 6)}…${address.slice(-6)}`;
  const copy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-ink/[0.04] transition text-left border-b border-ink/10"
    >
      <span className="min-w-0">
        <span className="block lowercase text-[11px] tracking-wide text-ink/35">{label}</span>
        <span className="block text-[13px] text-ink/80 truncate">{short}</span>
      </span>
      {copied ? (
        <Check size={13} strokeWidth={1.5} className="text-[var(--brand)] shrink-0" />
      ) : (
        <Copy size={13} strokeWidth={1.5} className="text-ink/40 shrink-0" />
      )}
    </button>
  );
}
