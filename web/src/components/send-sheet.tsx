"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Loader2, ExternalLink } from "lucide-react";

import { CustomSelect } from "@/components/custom-select";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useSend } from "@/hooks/use-send";
import { useSolanaContext } from "@/providers/solana-provider";
import { toBaseUnits } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { isValidAddressForChain } from "@/lib/wallet/transfer";
import { DEST_CHAINS, getDestChain } from "@/lib/wallet/outbound-destinations";

/** Withdraw your USDC into any asset, anywhere: Solana (USDC/SOL) or an EVM chain (USDC/native). */
export function SendSheet({ onClose }: { onClose: () => void }) {
  const { assets, loading } = useWalletAssets();
  const { walletAddress } = useSolanaContext();
  const { send, status, error: sendError } = useSend();

  const [destKey, setDestKey] = useState("solana");
  const [assetSym, setAssetSym] = useState("USDC");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ sig: string; crossChain: boolean } | null>(null);

  const source = useMemo(() => assets.find((a) => a.mint === USDC_MINT) ?? null, [assets]);
  const destChain = getDestChain(destKey);
  const destAsset = destChain.assets.find((a) => a.symbol === assetSym) ?? destChain.assets[0];
  const needsAddress = destAsset.kind !== "swap"; // swap (→SOL) lands in your own wallet

  const amountBase = source ? toBaseUnits(amount || "0", source.decimals) : BigInt(0);
  const validation = !source
    ? "You need USDC to withdraw"
    : amountBase <= BigInt(0)
      ? "Enter an amount"
      : amountBase > source.amount
        ? "Not enough USDC"
        : needsAddress && !isValidAddressForChain(to, destChain.chain)
          ? `Enter a valid ${destChain.chain === "ethereum" ? "EVM" : "Solana"} address`
          : null;
  const busy = status !== "idle";

  const handleSend = async () => {
    if (!source || validation) return;
    try {
      const target = needsAddress ? to : walletAddress?.toBase58() ?? "";
      setResult(await send({ source, destChain, destAsset, to: target, amountBase }));
    } catch {
      /* surfaced via sendError */
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
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
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">Withdraw</p>
            <h2 className="mt-1 font-sans text-xl text-white">Take your USDC anywhere</h2>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {result ? (
          <div className="text-center py-6">
            <p className="font-sans text-lg text-white">Sent ✓</p>
            {result.crossChain && (
              <p className="mt-1 font-mono text-[11px] text-white/40">Arriving on {destChain.label} shortly (~1 min)</p>
            )}
            <a
              href={`https://solscan.io/tx/${result.sig}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 font-mono text-xs text-accent hover:underline"
            >
              View on Solscan <ExternalLink size={12} strokeWidth={1.5} />
            </a>
          </div>
        ) : (
          <>
            <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-1.5">From</p>
            <p className="font-mono text-xs text-white/60 mb-4">
              {loading ? "Loading…" : source ? `USDC · ${source.uiAmount}` : "No USDC in your wallet"}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-1.5">To chain</p>
                <CustomSelect
                  value={destKey}
                  onChange={(k) => { setDestKey(k); setAssetSym(getDestChain(k).assets[0].symbol); }}
                  options={DEST_CHAINS.map((d) => ({ value: d.key, label: d.label }))}
                />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mb-1.5">Receive</p>
                <CustomSelect
                  value={destAsset.symbol}
                  onChange={setAssetSym}
                  options={destChain.assets.map((a) => ({ value: a.symbol, label: a.symbol }))}
                />
              </div>
            </div>

            {needsAddress ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-wide text-white/30 mt-4 mb-1.5">
                  To {destChain.chain === "ethereum" ? "EVM" : "Solana"} address
                </p>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder={destChain.chain === "ethereum" ? "0x…" : "Solana address"}
                  className="w-full bg-transparent border border-white/15 focus:border-white/40 outline-none rounded-[5px] px-3 py-2 font-mono text-xs text-white"
                />
              </>
            ) : (
              <p className="mt-4 font-mono text-[11px] text-white/40">→ swapped into SOL in your wallet</p>
            )}

            <div className="flex items-center justify-between mt-4 mb-1.5">
              <p className="font-mono text-[10px] uppercase tracking-wide text-white/30">Amount (USDC)</p>
              {source && (
                <button
                  onClick={() => setAmount(source.uiAmount.toString())}
                  className="font-mono text-[10px] uppercase tracking-wide text-accent/80 hover:text-accent"
                >
                  max
                </button>
              )}
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
              {busy ? <><Loader2 className="animate-spin" size={14} /> Sending…</> : validation ?? `Withdraw ${destAsset.symbol} to ${destChain.label}`}
            </button>

            {sendError && <p className="mt-3 font-mono text-xs text-red-400 text-center">{sendError}</p>}
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
