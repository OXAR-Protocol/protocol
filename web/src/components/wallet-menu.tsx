"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Copy, Check, LogOut, ChevronDown } from "lucide-react";

import { useSolanaContext } from "@/providers/solana-provider";
import { useEvmAddress } from "@/hooks/use-evm-address";
import type { SolanaWalletOption } from "@/lib/wallet/solana-wallets";

/**
 * Header wallet control: shows the active Solana address as a pill; the dropdown
 * lets the user SWITCH between linked Solana wallets (built-in vs Phantom — the
 * active one drives balances, positions AND the bridge receiver), copy any
 * address, and disconnect.
 */
export function WalletMenu() {
  const { logout } = usePrivy();
  const { walletAddress, wallets, setActiveWallet } = useSolanaContext();
  const evmAddress = useEvmAddress();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const solana = walletAddress?.toBase58() ?? null;
  const shortSolana = solana ? `${solana.slice(0, 4)}…${solana.slice(-4)}` : "";

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
      <span className="font-mono text-[11px] tracking-[0.15em] uppercase text-white/30">
        Connecting…
      </span>
    );
  }

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
        <div className="absolute right-0 mt-2 w-72 rounded-[6px] border border-white/15 bg-black shadow-lg overflow-hidden z-50">
          {wallets.length > 1 ? (
            <div className="border-b border-white/10">
              <p className="px-3 pt-2.5 pb-1 font-mono text-[9px] uppercase tracking-wide text-white/30">
                Active wallet · deposits & funds land here
              </p>
              {wallets.map((w) => (
                <WalletSwitchRow
                  key={w.address}
                  option={w}
                  active={w.address === solana}
                  onSelect={() => setActiveWallet(w.address)}
                />
              ))}
            </div>
          ) : (
            <AddressRow label="Solana" address={solana} />
          )}

          {evmAddress && <AddressRow label="EVM" address={evmAddress} />}

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

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-6)}`;

function useCopy(address: string) {
  const [copied, setCopied] = useState(false);
  return {
    copied,
    copy: () => {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    },
  };
}

/** A switchable Solana wallet: click the row to make it active, or copy it. */
function WalletSwitchRow({
  option,
  active,
  onSelect,
}: {
  option: SolanaWalletOption;
  active: boolean;
  onSelect: () => void;
}) {
  const { copied, copy } = useCopy(option.address);
  return (
    <div
      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 transition ${
        active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
      }`}
    >
      <button onClick={onSelect} className="flex items-center gap-2 min-w-0 text-left">
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? "bg-accent" : "bg-white/20"}`} />
        <span className="min-w-0">
          <span className="block font-mono text-[9px] uppercase tracking-wide text-white/40">
            {option.label}
            {active ? " · active" : ""}
          </span>
          <span className="block font-mono text-[11px] text-white/80 truncate">{short(option.address)}</span>
        </span>
      </button>
      <button onClick={copy} aria-label="Copy address" className="shrink-0 p-1">
        {copied ? (
          <Check size={13} strokeWidth={1.5} className="text-accent" />
        ) : (
          <Copy size={13} strokeWidth={1.5} className="text-white/40 hover:text-white/70" />
        )}
      </button>
    </div>
  );
}

/** One copyable address line (used for the EVM address and the single-wallet case). */
function AddressRow({ label, address }: { label: string; address: string }) {
  const { copied, copy } = useCopy(address);
  return (
    <button
      onClick={copy}
      className="w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/[0.06] transition text-left border-b border-white/10"
    >
      <span className="min-w-0">
        <span className="block font-mono text-[9px] uppercase tracking-wide text-white/30">{label}</span>
        <span className="block font-mono text-[11px] text-white/80 truncate">{short(address)}</span>
      </span>
      {copied ? (
        <Check size={13} strokeWidth={1.5} className="text-accent shrink-0" />
      ) : (
        <Copy size={13} strokeWidth={1.5} className="text-white/40 shrink-0" />
      )}
    </button>
  );
}
