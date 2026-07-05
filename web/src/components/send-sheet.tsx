"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Loader2, ExternalLink } from "lucide-react";

import { CustomSelect } from "@/components/custom-select";
import { AssetPicker } from "@/components/asset-picker";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useSend } from "@/hooks/use-send";
import { useSolanaContext } from "@/providers/solana-provider";
import { toBaseUnits } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { isValidAddressForChain, maxSendable } from "@/lib/wallet/transfer";
import { DEST_CHAINS, getDestChain, outboundKind } from "@/lib/wallet/outbound-destinations";
import { useT } from "@/lib/i18n";

/** Send any held Solana asset into any asset, anywhere (transfer / swap / bridge). */
export function SendSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const { assets, loading } = useWalletAssets();
  const { walletAddress } = useSolanaContext();
  const { send, status, error: sendError } = useSend();

  const [sourceMint, setSourceMint] = useState<string | null>(null);
  // Default to a same-chain Solana send — the common case. Cross-chain (Base/Arbitrum)
  // is still selectable below; opening straight onto a bridge was the confusing part.
  const [destKey, setDestKey] = useState("solana");
  const [assetSym, setAssetSym] = useState("USDC");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ sig: string; crossChain: boolean } | null>(null);

  // Default source: USDC if held, else the largest holding.
  const source = useMemo(() => {
    const pick = sourceMint ?? assets.find((a) => a.mint === USDC_MINT)?.mint ?? assets[0]?.mint;
    return assets.find((a) => a.mint === pick) ?? null;
  }, [assets, sourceMint]);

  const destChain = getDestChain(destKey);
  const destAsset = destChain.assets.find((a) => a.symbol === assetSym) ?? destChain.assets[0];
  const kind = source ? outboundKind(source.mint, destChain, destAsset.mint) : "transfer";
  const needsAddress = kind !== "swap"; // swap lands in your own wallet

  const amountBase = source ? toBaseUnits(amount || "0", source.decimals) : BigInt(0);
  const validation = !source
    ? t("send.errNoAssets")
    : amountBase <= BigInt(0)
      ? t("send.errAmount")
      : amountBase > maxSendable(source)
        ? t("send.notEnough", { sym: source.symbol })
        : needsAddress && !isValidAddressForChain(to, destChain.chain)
          ? t("send.errAddress", { chain: destChain.chain === "ethereum" ? "EVM" : "Solana" })
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
      className="fixed inset-0 z-[60] bg-white/70 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: "spring", damping: 26, stiffness: 220 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[440px] bg-white border border-black/15 rounded-[12px] p-6 md:p-7"
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">{t("send.label")}</p>
            <h2 className="mt-1 text-xl text-black">{t("send.title")}</h2>
          </div>
          <button onClick={onClose} className="text-black/45 hover:text-black transition">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        {result ? (
          <div className="text-center py-6">
            <p className="text-lg text-black">{t("send.sent")}</p>
            {result.crossChain && (
              <p className="mt-1 text-[11px] text-black/45">{t("send.arriving", { chain: destChain.label })}</p>
            )}
            <a
              href={`https://solscan.io/tx/${result.sig}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#3c05c7] hover:underline"
            >
              {t("send.viewSolscan")} <ExternalLink size={12} strokeWidth={1.5} />
            </a>
          </div>
        ) : (
          <>
            <p className="text-[10px] lowercase tracking-wide text-black/40 mb-1.5">{t("send.youSend")}</p>
            {loading ? (
              <p className="text-xs text-black/40">{t("send.loading")}</p>
            ) : assets.length === 0 ? (
              <p className="text-xs text-black/40">{t("send.noAssets")}</p>
            ) : (
              <AssetPicker assets={assets} value={source?.mint ?? null} onChange={setSourceMint} />
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <p className="text-[10px] lowercase tracking-wide text-black/40 mb-1.5">{t("send.toChain")}</p>
                <CustomSelect
                  value={destKey}
                  onChange={(k) => { setDestKey(k); setAssetSym(getDestChain(k).assets[0].symbol); }}
                  options={DEST_CHAINS.map((d) => ({ value: d.key, label: d.label }))}
                />
              </div>
              <div>
                <p className="text-[10px] lowercase tracking-wide text-black/40 mb-1.5">{t("send.receive")}</p>
                <CustomSelect
                  value={destAsset.symbol}
                  onChange={setAssetSym}
                  options={destChain.assets.map((a) => ({ value: a.symbol, label: a.symbol }))}
                />
              </div>
            </div>

            {needsAddress ? (
              <>
                <p className="text-[10px] lowercase tracking-wide text-black/40 mt-4 mb-1.5">
                  {t("send.toAddress", { chain: destChain.chain === "ethereum" ? "EVM" : "Solana" })}
                </p>
                <input
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder={destChain.chain === "ethereum" ? "0x…" : t("send.addressPlaceholder")}
                  className="w-full bg-transparent border border-black/15 focus:border-black/40 outline-none rounded-[5px] px-3 py-2 text-xs text-black"
                />
              </>
            ) : (
              <p className="mt-4 text-[11px] text-black/45">→ {destAsset.symbol} into your wallet</p>
            )}

            <div className="flex items-center justify-between mt-4 mb-1.5">
              <p className="text-[10px] lowercase tracking-wide text-black/40">
                {t("send.amount")}{source ? ` (${source.symbol})` : ""}
              </p>
              {source && (
                <button
                  onClick={() => setAmount((Number(maxSendable(source)) / 10 ** source.decimals).toString())}
                  className="text-[10px] lowercase tracking-wide text-[#3c05c7]/80 hover:text-[#3c05c7]"
                >
                  {t("rail.max")}
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
              className="w-full bg-transparent border-b border-black/15 focus:border-black/40 outline-none text-xl text-black py-1"
            />

            <button
              onClick={handleSend}
              disabled={busy || !!validation}
              className="mt-5 w-full px-4 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
            >
              {busy ? <><Loader2 className="animate-spin" size={14} /> {t("send.sending")}</> : validation ?? t("send.action", { asset: destAsset.symbol, chain: destChain.label })}
            </button>

            {sendError && <p className="mt-3 text-xs text-red-400 text-center">{sendError}</p>}
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
