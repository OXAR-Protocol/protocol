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
      <span className="lowercase text-[14px] text-black/40">connecting…</span>
    );
  }

  const item =
    "w-full flex items-center gap-2 px-3 py-2.5 lowercase text-[14px] text-black/60 transition text-left";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-black/15 px-4 py-2 lowercase text-[14px] text-black/70 transition-colors hover:border-black/40 hover:text-black"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#3c05c7]" />
        {shortSolana}
        <ChevronDown size={13} strokeWidth={1.5} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-[12px] border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <AddressRow label="your wallet" address={solana} />

          <button
            onClick={() => { setOpen(false); setShowSend(true); }}
            className={`${item} border-b border-black/10 hover:bg-black/[0.04] hover:text-black`}
          >
            <ArrowUpRight size={13} strokeWidth={1.5} />
            send
          </button>

          {isEmbedded && (
            <button
              onClick={() => { setOpen(false); void exportWallet({ address: solana }); }}
              className={`${item} border-b border-black/10 hover:bg-black/[0.04] hover:text-black`}
            >
              <KeyRound size={13} strokeWidth={1.5} />
              export private key
            </button>
          )}

          <button
            onClick={() => { setOpen(false); logout(); }}
            className={`${item} hover:bg-black/[0.04] hover:text-red-600`}
          >
            <LogOut size={13} strokeWidth={1.5} />
            disconnect
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
      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-black/[0.04] transition text-left border-b border-black/10"
    >
      <span className="min-w-0">
        <span className="block lowercase text-[11px] tracking-wide text-black/35">{label}</span>
        <span className="block text-[13px] text-black/80 truncate">{short}</span>
      </span>
      {copied ? (
        <Check size={13} strokeWidth={1.5} className="text-[#3c05c7] shrink-0" />
      ) : (
        <Copy size={13} strokeWidth={1.5} className="text-black/40 shrink-0" />
      )}
    </button>
  );
}
