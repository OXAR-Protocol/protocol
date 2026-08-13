"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { SheetShell } from "@/components/sheet-shell";
import { SendNetwork } from "@/components/send-network";
import { SendAddress } from "@/components/send-address";
import { SendAmount } from "@/components/send-amount";
import { SendToken } from "@/components/send-token";
import { SendReview } from "@/components/send-review";
import { useWalletAssets } from "@/hooks/use-wallet-assets";
import { useSend } from "@/hooks/use-send";
import { useBridgePreview } from "@/hooks/use-bridge-preview";
import { toBaseUnitsPartial } from "@oxar/sdk";
import { USDC_MINT } from "@/lib/constants";
import { maxSendable } from "@/lib/wallet/transfer";
import { canLeaveSolana, getDestChain, type DestAsset } from "@/lib/wallet/outbound-destinations";
import { useT } from "@/lib/i18n";

type Step = "token" | "network" | "address" | "amount" | "review";

/**
 * Sending money, one question at a time.
 *
 * This was a single form: pick an asset, pick a chain, pick what arrives, paste an
 * address, type an amount — five decisions stacked on one screen, in a dialog
 * dropped into the middle of the page. Most of them have an obvious answer
 * (dollars, this address, all of it), and a form asks them all at once anyway.
 *
 * So it's a sequence now. Which network — because an address is chain-shaped, and
 * asking for it before the network invites pasting one and choosing the wrong
 * other. Then the address, alone on its screen. Then the amount, which is the only
 * number worth looking at, so it gets the size and its own keypad; what's being
 * sent sits under it as a pill, dollars unless you say otherwise. Then the review,
 * because sending is the one irreversible act in the app.
 */
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

  const [step, setStep] = useState<Step>("token");
  const [destKey, setDestKey] = useState(initialDestKey);
  const [sourceMint, setSourceMint] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [result, setResult] = useState<{ sig: string; crossChain: boolean } | null>(null);

  // Default source: dollars if held, else the largest holding.
  const source = useMemo(() => {
    const pick = sourceMint ?? assets.find((a) => a.mint === USDC_MINT)?.mint ?? assets[0]?.mint;
    return assets.find((a) => a.mint === pick) ?? null;
  }, [assets, sourceMint]);

  const destChain = getDestChain(destKey);
  const isSolanaDest = destChain.chain === "solana";
  // Same-chain sends the SAME asset to the address; a cross-chain send settles in
  // the destination's dollars, which is what anyone bridging actually wants.
  const destAsset: DestAsset =
    isSolanaDest && source
      ? { symbol: source.symbol, mint: source.mint, decimals: source.decimals }
      : destChain.assets[0]!;

  // "0." is what this field holds between the zero and the cents, and the strict
  // parser throws on it — during a render, which on a phone reads as "the page
  // couldn't load". Half-typed means zero here, not a crash.
  const amountBase = source ? (toBaseUnitsPartial(amount, source.decimals) ?? BigInt(0)) : BigInt(0);
  const busy = status !== "idle";

  // Crossing a chain costs a fee the bridge sets, and it used to be discovered by
  // sending. Now it's quoted while the amount can still be changed.
  const bridge = useBridgePreview({
    amountBase,
    decimals: source?.decimals ?? 6,
    originMint: source?.mint ?? "",
    destChainId: destChain.chainId,
    destMint: destAsset.mint,
    destDecimals: destAsset.decimals,
    to: to.trim(),
    enabled: !isSolanaDest && !!source && amountBase > BigInt(0) && amountBase <= maxSendable(source!),
  });

  const handleSend = async () => {
    if (!source) return;
    try {
      setResult(await send({ source, destChain, destAsset, to, amountBase }));
    } catch {
      /* surfaced via sendError */
    }
  };

  // Back retraces the way in. From the address, that's the network — unless this
  // holding never had a network to choose, in which case it's the token list.
  const back: Record<Step, Step | null> = {
    token: null,
    network: "token",
    address: source && canLeaveSolana(source.mint) ? "network" : "token",
    amount: "address",
    review: "amount",
  };

  const titleKey: Record<Step, string> = {
    network: t("send.step.network"),
    address: t("send.step.address"),
    amount: t("send.step.amount"),
    token: t("send.step.token"),
    review: t("send.step.review"),
  };

  return (
    <SheetShell label={t("send.label")} title={result ? t("send.sent") : titleKey[step]} onClose={onClose}>
      {result ? (
        <div className="py-6 text-center">
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
          {back[step] && !busy && (
            <button
              type="button"
              onClick={() => setStep(back[step]!)}
              className="mb-4 inline-flex items-center gap-1.5 text-[13px] lowercase text-black/40 transition hover:text-black"
            >
              <ArrowLeft size={13} strokeWidth={1.5} />
              {t("fund.back")}
            </button>
          )}

          {step === "network" && source ? (
            <SendNetwork
              mint={source.mint}
              symbol={source.symbol}
              onPick={(key) => {
                setDestKey(key);
                setStep("address");
              }}
            />
          ) : step === "address" ? (
            <SendAddress chain={destChain} value={to} onChange={setTo} onContinue={() => setStep("amount")} />
          ) : step === "token" ? (
            loading ? (
              <p className="text-[13px] text-black/45">{t("send.loading")}</p>
            ) : (
              <SendToken
                assets={assets}
                activeMint={source?.mint ?? null}
                onPick={(mint) => {
                  setSourceMint(mint);
                  setAmount("");
                  // A share, gold or a yield receipt has no market on another chain,
                  // so there is no network question to ask — it goes to a Solana
                  // address or nowhere. Skipping a one-answer screen beats showing it.
                  if (canLeaveSolana(mint)) {
                    setStep("network");
                  } else {
                    setDestKey("solana");
                    setStep("address");
                  }
                }}
              />
            )
          ) : step === "amount" ? (
            loading ? (
              <p className="text-[13px] text-black/45">{t("send.loading")}</p>
            ) : source ? (
              <SendAmount
                asset={source}
                value={amount}
                onChange={setAmount}
                onPickToken={() => setStep("token")}
                onContinue={() => setStep("review")}
                note={
                  !isSolanaDest && (bridge.quoting || bridge.outAmount !== null)
                    ? bridge.quoting
                      ? t("deposit.quoting")
                      : t("send.arrives", {
                          value: `${bridge.outAmount!.toFixed(2)} ${destAsset.symbol}`,
                          chain: destChain.label,
                        })
                    : undefined
                }
              />
            ) : (
              <p className="text-[13px] text-black/45">{t("send.noAssets")}</p>
            )
          ) : source ? (
            <SendReview
              amount={amount}
              symbol={source.symbol}
              to={to.trim()}
              chainLabel={destChain.label}
              isEvm={!isSolanaDest}
              busy={busy}
              onBack={() => setStep("amount")}
              onConfirm={handleSend}
            />
          ) : null}

          {sendError && <p className="mt-3 text-center text-xs text-red-500">{sendError}</p>}
        </>
      )}
    </SheetShell>
  );
}
