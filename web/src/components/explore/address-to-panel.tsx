"use client";

import { useMemo } from "react";
import { PublicKey } from "@solana/web3.js";
import { Send } from "lucide-react";

interface AddressToPanelProps {
  address: string;
  onAddressChange: (value: string) => void;
}

function shortAddress(addr: string): string {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function AddressToPanel({
  address,
  onAddressChange,
}: AddressToPanelProps) {
  const validation = useMemo(() => {
    if (!address.trim()) return { state: "empty" as const };
    try {
      const pk = new PublicKey(address.trim());
      return { state: "valid" as const, pubkey: pk };
    } catch {
      return { state: "invalid" as const };
    }
  }, [address]);

  return (
    <div className="h-full w-full rounded-[5px] border border-white/10 bg-surface-0 p-6 text-left flex flex-col justify-between transition-colors hover:border-white/15 min-h-[360px]">
      <div>
        <div className="flex items-center justify-between mb-5">
          <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            To
          </label>
          <span className="font-mono text-[10px] text-white/20">
            Solana address
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center shrink-0">
            <Send size={16} className="text-white/60" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-sans text-base text-white">
              {validation.state === "valid"
                ? shortAddress(validation.pubkey.toBase58())
                : "Recipient"}
            </span>
            <span className="font-mono text-[10px] text-white/30 uppercase truncate">
              {validation.state === "valid"
                ? "Verified"
                : validation.state === "invalid"
                  ? "Invalid address"
                  : "Paste a Solana wallet"}
            </span>
          </div>
        </div>
      </div>

      <div className="border-y border-white/[0.06] py-5 my-5">
        <input
          type="text"
          placeholder="Paste address"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          className="bg-transparent text-white font-mono text-base font-light w-full outline-none placeholder:text-white/15 break-all"
        />
        <span
          className={`font-mono text-[10px] mt-1 block uppercase tracking-wide ${
            validation.state === "invalid" ? "text-loss" : "text-white/25"
          }`}
        >
          {validation.state === "valid"
            ? "Address verified"
            : validation.state === "invalid"
              ? "Not a valid Solana address"
              : "Tokens will arrive instantly"}
        </span>
      </div>

      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wide">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
          <span className="text-white/40">Direct transfer</span>
        </div>
        <span className="text-white/25">No marketplace fee</span>
      </div>
    </div>
  );
}
