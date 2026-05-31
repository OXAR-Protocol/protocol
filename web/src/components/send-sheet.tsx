"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, ExternalLink } from "lucide-react";

import { CustomSelect } from "@/components/custom-select";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useSend } from "@/hooks/use-send";
import { toBaseUnits } from "@/lib/yield";
import { maxSendable, validateSend } from "@/lib/wallet/transfer";

/** Send SOL / SPL tokens from the active wallet to any Solana address. */
export function SendSheet({ onClose }: { onClose: () => void }) {
  const { assets, loading } = useWalletAssets();
  const { send, status, error: sendError } = useSend();

  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [sig, setSig] = useState<string | null>(null);

  const asset = useMemo(
    () => assets.find((a) => a.mint === selectedMint) ?? assets[0] ?? null,
    [assets, selectedMint],
  );

  const amountBase = asset ? toBaseUnits(amount || "0", asset.decimals) : BigInt(0);
  const validation = validateSend({ asset, to, amountBase });
  const busy = status !== "idle";

  const setMax = () => {
    if (!asset) return;
    setAmount((Number(maxSendable(asset)) / 10 ** asset.decimals).toString());
  };

  const handleSend = async () => {
    if (!asset || validation) return;
    try {
      setSig(await send(asset, to, amountBase));
    } catch {
      /* surfaced via sendError */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center px-4 pb-4 md:pb-0"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] bg-black border border-white/15 rounded-[12px] p-6 md:p-7"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">Send</p>
            <h2 className="mt-1 font-sans text-xl text-white">Move funds out</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {sig ? (
          <div className="text-center py-6">
            <p className="font-sans text-lg text-white">Sent ✓</p>
            <a
              href={`https://solscan.io/tx/${sig}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-accent hover:underline"
            >
              View on Solscan <ExternalLink size={12} strokeWidth={1.5} />
            </a>
          </div>
        ) : (
          <>
            <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-1.5">Asset</p>
            {loading ? (
              <p className="font-mono text-xs text-white/30">Loading…</p>
            ) : assets.length === 0 ? (
              <p className="font-mono text-xs text-white/30">No assets to send.</p>
            ) : (
              <CustomSelect
                value={asset?.mint ?? ""}
                onChange={setSelectedMint}
                options={assets.map((a) => ({ value: a.mint, label: `${a.symbol} · ${a.uiAmount}` }))}
              />
            )}

            <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mt-4 mb-1.5">To address</p>
            <input
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="Solana address"
              className="w-full bg-transparent border border-white/15 focus:border-white/40 outline-none rounded-[5px] px-3 py-2 font-mono text-xs text-white"
            />

            <div className="flex items-center justify-between mt-4 mb-1.5">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">Amount</p>
              <button onClick={setMax} className="font-mono text-[10px] uppercase tracking-wide text-accent/80 hover:text-accent">
                max
              </button>
            </div>
            <input
              type="number"
              min={0}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-xl text-white py-1"
            />

            <button
              onClick={handleSend}
              disabled={busy || !!validation}
              className="mt-5 w-full px-4 py-2.5 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
            >
              {busy ? <><Loader2 className="animate-spin" size={14} /> Sending…</> : validation ?? "Send"}
            </button>

            {sendError && <p className="mt-3 font-mono text-xs text-red-400 text-center">{sendError}</p>}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
