"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, Loader2, ExternalLink, ClipboardPaste } from "lucide-react";

import { CustomSelect } from "@/components/custom-select";
import { SendReview } from "@/components/send-review";
import { AssetPicker } from "@/components/asset-picker";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useSend } from "@/hooks/use-send";
import { useBridgePreview } from "@/hooks/use-bridge-preview";
import { toBaseUnits } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { isValidAddressForChain, maxSendable } from "@/lib/wallet/transfer";
import { DEST_CHAINS, getDestChain, type DestAsset } from "@/lib/wallet/outbound-destinations";
import { useT } from "@/lib/i18n";

/** Send any held Solana asset into any asset, anywhere (transfer / swap / bridge). */
export function SendSheet({
  onClose,
  initialDestKey = "solana",
}: {
  onClose: () => void;
  /** Preselect a destination — cash-out opens straight onto Base, where Paybis pays. */
  initialDestKey?: string;
}) {
  const { t } = useT();
  const { assets, loading } = useWalletAssets();
  const { send, status, error: sendError } = useSend();

  const [sourceMint, setSourceMint] = useState<string | null>(null);
  // Default to a same-chain Solana send — the common case. Cross-chain (Base/Arbitrum)
  // is still selectable below; opening straight onto a bridge was the confusing part.
  const [destKey, setDestKey] = useState(initialDestKey);
  const [assetSym, setAssetSym] = useState("USDC");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ sig: string; crossChain: boolean } | null>(null);
  // The form and its last look before the money goes. Sending is the one
  // irreversible act here, so it never happens straight off the form.
  const [reviewing, setReviewing] = useState(false);

  // Default source: USDC if held, else the largest holding.
  const source = useMemo(() => {
    const pick = sourceMint ?? assets.find((a) => a.mint === USDC_MINT)?.mint ?? assets[0]?.mint;
    return assets.find((a) => a.mint === pick) ?? null;
  }, [assets, sourceMint]);

  const destChain = getDestChain(destKey);
  const isSolanaDest = destChain.chain === "solana";
  // Same-chain send moves the SAME asset to the address; only a cross-chain
  // (Delora) send lets you choose what lands on the other network.
  const destAsset: DestAsset =
    isSolanaDest && source
      ? { symbol: source.symbol, mint: source.mint, decimals: source.decimals }
      : destChain.assets.find((a) => a.symbol === assetSym) ?? destChain.assets[0];

  const amountBase = source ? toBaseUnits(amount || "0", source.decimals) : BigInt(0);
  const validation = !source
    ? t("send.errNoAssets")
    : amountBase <= BigInt(0)
      ? t("send.errAmount")
      : amountBase > maxSendable(source)
        ? t("send.notEnough", { sym: source.symbol })
        : !isValidAddressForChain(to, destChain.chain)
          ? t("send.errAddress", { chain: destChain.chain === "ethereum" ? "EVM" : "Solana" })
          : null;
  const busy = status !== "idle";

  // Crossing a chain costs a fee the bridge sets, and it used to be discovered by
  // sending. Now it's quoted while the amount can still be changed.
  const bridgePreview = useBridgePreview({
    amountBase,
    decimals: source?.decimals ?? 6,
    originMint: source?.mint ?? "",
    destChainId: destChain.chainId,
    destMint: destAsset.mint,
    destDecimals: destAsset.decimals,
    to: to.trim(),
    enabled: !isSolanaDest && !!source && !validation,
  });

  const paste = async () => {
    try {
      setTo((await navigator.clipboard.readText()).trim());
    } catch {
      // Clipboard read denied — typing still works.
    }
  };

  const handleSend = async () => {
    if (!source || validation) return;
    try {
      setResult(await send({ source, destChain, destAsset, to, amountBase }));
    } catch {
      /* surfaced via sendError */
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      data-no-pull
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
        ) : reviewing && source ? (
          <SendReview
            amount={amount}
            symbol={source.symbol}
            to={to.trim()}
            chainLabel={destChain.label}
            isEvm={!isSolanaDest}
            busy={busy}
            onBack={() => setReviewing(false)}
            onConfirm={handleSend}
          />
        ) : (
          <>
            {/* What is leaving. The picker already shows the icon, the symbol and the
                balance, so a label above it would only repeat itself. */}
            {loading ? (
              <p className="text-xs text-black/40">{t("send.loading")}</p>
            ) : assets.length === 0 ? (
              <p className="text-xs text-black/40">{t("send.noAssets")}</p>
            ) : (
              <AssetPicker assets={assets} value={source?.mint ?? null} onChange={setSourceMint} />
            )}

            <div className={`mt-4 grid gap-3 ${isSolanaDest ? "grid-cols-1" : "grid-cols-2"}`}>
              <div>
                <p className="text-[10px] lowercase tracking-wide text-black/40 mb-1.5">{t("send.toChain")}</p>
                <CustomSelect
                  value={destKey}
                  onChange={(k) => { setDestKey(k); setAssetSym(getDestChain(k).assets[0].symbol); }}
                  options={DEST_CHAINS.map((d) => ({ value: d.key, label: d.label }))}
                />
              </div>
              {/* Cross-chain only: pick what lands on the other network. Same-chain
                  sends the SAME asset, so there's nothing to choose. */}
              {!isSolanaDest && (
                <div>
                  <p className="text-[10px] lowercase tracking-wide text-black/40 mb-1.5">{t("send.receive")}</p>
                  <CustomSelect
                    value={destAsset.symbol}
                    onChange={setAssetSym}
                    options={destChain.assets.map((a) => ({ value: a.symbol, label: a.symbol }))}
                  />
                </div>
              )}
            </div>

            <p className="text-[10px] lowercase tracking-wide text-black/40 mt-4 mb-1.5">
              {t("send.toAddress", { chain: destChain.chain === "ethereum" ? "EVM" : "Solana" })}
            </p>
            <div className="flex items-center gap-2 rounded-[5px] border border-black/15 px-3 py-2 focus-within:border-black/40">
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={destChain.chain === "ethereum" ? "0x…" : t("send.addressPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-xs text-black outline-none"
              />
              {/* Addresses are pasted, never typed — the button saves a fiddly long-press
                  on a phone, which is where this is used. */}
              <button
                type="button"
                onClick={paste}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] lowercase tracking-wide text-black/45 transition hover:text-black"
              >
                <ClipboardPaste size={12} strokeWidth={1.5} />
                {t("send.paste")}
              </button>
            </div>
            {/* EVM addresses look identical on every chain — remind which network
                the funds land on so nothing is sent to the wrong one. */}
            {!isSolanaDest && to.trim() !== "" && (
              <p className="mt-1.5 text-[10px] leading-snug text-[#3c05c7]/80">
                {t("send.evmWarning", { chain: destChain.label })}
              </p>
            )}

            {/* How much — the one number in here worth looking at, so it gets the
                size. `max` sits inside the row rather than floating above it as a
                link, and the balance sits under it as one quiet line instead of a
                label of its own. */}
            <p className="mt-5 text-[10px] lowercase tracking-wide text-black/40">{t("send.amount")}</p>
            <div className="mt-1 flex items-baseline gap-3 border-b border-black/15 py-1 focus-within:border-black/40">
              <input
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="min-w-0 flex-1 bg-transparent text-[2rem] font-light leading-none tracking-[-0.02em] text-black tabular-nums outline-none"
              />
              {source && (
                <>
                  <span className="shrink-0 text-sm text-black/45">{source.symbol}</span>
                  <button
                    onClick={() => setAmount((Number(maxSendable(source)) / 10 ** source.decimals).toString())}
                    className="shrink-0 rounded-full border border-black/15 px-2.5 py-1 text-[10px] lowercase tracking-wide text-black/55 transition hover:border-black/40 hover:text-black"
                  >
                    {t("rail.max")}
                  </button>
                </>
              )}
            </div>
            {source && (
              <p className="mt-1.5 text-[11px] tabular-nums text-black/40">
                {t("rail.available")} {(Number(maxSendable(source)) / 10 ** source.decimals).toLocaleString(undefined, { maximumFractionDigits: 6 })} {source.symbol}
              </p>
            )}

            {/* The reason it can't go yet belongs beside the form, not inside the
                button: a control that names the action and then names the problem
                instead is doing two jobs, and the action is the one it forgets. */}
            {/* What lands on the other side — the bridge's fee, said before signing
                rather than discovered after. */}
            {!isSolanaDest && (bridgePreview.quoting || bridgePreview.outAmount !== null) && (
              <p className="mt-3 text-[11px] tabular-nums text-black/45">
                {bridgePreview.quoting
                  ? t("deposit.quoting")
                  : t("send.arrives", {
                      value: `${bridgePreview.outAmount!.toFixed(2)} ${destAsset.symbol}`,
                      chain: destChain.label,
                    })}
              </p>
            )}

            {!busy && validation && (
              <p className="mt-4 text-[11px] leading-snug text-black/45">{validation}</p>
            )}
            <button
              onClick={() => setReviewing(true)}
              disabled={busy || !!validation}
              className="mt-3 w-full px-4 py-3.5 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-25 transition inline-flex items-center justify-center gap-2"
            >
              {busy ? <><Loader2 className="animate-spin" size={14} /> {t("send.sending")}</> : t("send.review.open")}
            </button>

            {sendError && <p className="mt-3 text-xs text-red-400 text-center">{sendError}</p>}
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
