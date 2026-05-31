"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Copy, Check, LogOut, ChevronDown } from "lucide-react";

import { useSolanaContext } from "@/providers/solana-provider";

/**
 * Header wallet control: shows the connected address as a pill; clicking it opens
 * a small menu to copy the address or disconnect. Renders nothing until a wallet
 * address is available (Privy may still be creating the embedded one).
 */
export function WalletMenu() {
  const { logout } = usePrivy();
  const { walletAddress } = useSolanaContext();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const wallet = walletAddress?.toBase58() ?? null;
  const shortWallet = wallet ? `${wallet.slice(0, 4)}…${wallet.slice(-4)}` : "";

  // Close on click outside.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!wallet) {
    return (
      <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-white/30">
        Connecting…
      </span>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-[5px] border border-white/10 hover:border-white/30 font-mono text-[11px] tracking-[0.1em] uppercase text-white/70 hover:text-white transition-colors"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        {shortWallet}
        <ChevronDown
          size={12}
          strokeWidth={1.5}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 rounded-[6px] border border-white/15 bg-black shadow-lg overflow-hidden z-50">
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide text-white/60 hover:text-white hover:bg-white/[0.06] transition text-left"
          >
            {copied ? (
              <>
                <Check size={12} strokeWidth={1.5} />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} strokeWidth={1.5} />
                Copy address
              </>
            )}
          </button>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 font-mono text-[11px] uppercase tracking-wide text-white/60 hover:text-red-400 hover:bg-white/[0.06] transition text-left border-t border-white/10"
          >
            <LogOut size={12} strokeWidth={1.5} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
