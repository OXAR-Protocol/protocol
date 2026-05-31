"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";
import { AnimatePresence } from "framer-motion";
import { Copy, Check, LogOut, ChevronDown, ArrowUpRight, KeyRound } from "lucide-react";

import { useSolanaContext } from "@/providers/solana-provider";
import { SendSheet } from "@/components/send-sheet";

/**
 * Header wallet control: shows the active Solana address as a pill; the dropdown
 * lists addresses (Solana + EVM) to copy, a Send action (move funds out to any
 * address), an Export action for the built-in wallet, and disconnect.
 */
export function WalletMenu() {
  const { user, logout } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const { exportWallet } = useExportWallet();
  const [open, setOpen] = useState(false);
  const [showSend, setShowSend] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const solana = walletAddress?.toBase58() ?? null;
  const shortSolana = solana ? `${solana.slice(0, 4)}…${solana.slice(-4)}` : "";
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
      <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-white/30">Connecting…</span>
    );
  }

  const item =
    "w-full flex items-center gap-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide text-white/60 transition text-left";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-[5px] border border-white/10 hover:border-white/30 font-mono text-[11px] tracking-[0.1em] uppercase text-white/70 hover:text-white transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        {shortSolana}
        <ChevronDown size={12} strokeWidth={1.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 rounded-[6px] border border-white/15 bg-black shadow-lg overflow-hidden z-50">
          <AddressRow label="Your wallet" address={solana} />

          <button
            onClick={() => { setOpen(false); setShowSend(true); }}
            className={`${item} hover:text-white hover:bg-white/[0.06] border-b border-white/10`}
          >
            <ArrowUpRight size={12} strokeWidth={1.5} />
            Send
          </button>

          {isEmbedded && (
            <button
              onClick={() => { setOpen(false); void exportWallet({ address: solana }); }}
              className={`${item} hover:text-white hover:bg-white/[0.06] border-b border-white/10`}
            >
              <KeyRound size={12} strokeWidth={1.5} />
              Export private key
            </button>
          )}

          <button
            onClick={() => { setOpen(false); logout(); }}
            className={`${item} hover:text-red-400 hover:bg-white/[0.06]`}
          >
            <LogOut size={12} strokeWidth={1.5} />
            Disconnect
          </button>
        </div>
      )}

      <AnimatePresence>{showSend && <SendSheet onClose={() => setShowSend(false)} />}</AnimatePresence>
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
      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/[0.06] transition text-left border-b border-white/10"
    >
      <span className="min-w-0">
        <span className="block font-mono text-[9px] uppercase tracking-wide text-white/30">{label}</span>
        <span className="block font-mono text-[11px] text-white/80 truncate">{short}</span>
      </span>
      {copied ? (
        <Check size={13} strokeWidth={1.5} className="text-accent shrink-0" />
      ) : (
        <Copy size={13} strokeWidth={1.5} className="text-white/40 shrink-0" />
      )}
    </button>
  );
}
