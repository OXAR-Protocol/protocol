"use client";

import { Loader2 } from "lucide-react";

import type { ProviderView } from "@/hooks/use-yield-positions";
import type { NetPreview } from "@/hooks/use-net-preview";
import type { SwapInPreview } from "@/hooks/use-swap-in-preview";
import type { WalletAsset } from "@oxar/sdk";
import { BridgeSteps, type BridgeStep } from "@/components/bridge-steps";
import { isNativeEvm } from "@/lib/evm/erc20";
import { useT, localizeError } from "@/lib/i18n";

interface Props {
  verb: string;
  usdAmount: number;
  payAsset: WalletAsset;
  view: ProviderView;
  isDirect: boolean;
  preview: NetPreview;
  swapIn: SwapInPreview;
  busy: boolean;
  label: string | null;
  /** Live deposit status ("idle" before signing) — drives the bridge step tracker. */
  status: string;
  error: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

const money = (n: number) => `$${(n < 0.01 ? n.toFixed(4) : n.toFixed(2)).replace(/0+$/, "").replace(/\.$/, "")}`;

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex items-baseline justify-between gap-3 py-2">
    <span className="lowercase text-[12px] text-black/45">{k}</span>
    <span className="text-[13px] tabular-nums text-black text-right">{v}</span>
  </div>
);

/** "No surprises" review shown before a deposit signs: what you pay, what you'll
 *  actually hold (net of the swap), where it goes, and that you stay in control. */
export function DepositConfirm({
  verb,
  usdAmount,
  payAsset,
  view,
  isDirect,
  preview,
  swapIn,
  busy,
  label,
  status,
  error,
  onConfirm,
  onBack,
}: Props) {
  const { t } = useT();
  const held = !!view.heldMint;
  // Cross-chain confirms several steps in the wallet — show the sequence up front so
  // the multiple prompts feel guided, not random. Native ETH skips the approve step.
  const isBridge = payAsset.chain === "ethereum";
  const bridgeSteps: BridgeStep[] = isBridge
    ? [
        ...(isNativeEvm(payAsset.mint) ? [] : [{ key: "approving", label: t("confirm.step.approve") }]),
        { key: "bridging", label: t("confirm.step.bridge") },
        { key: "buy", label: t("confirm.step.buy") },
      ]
    : [];
  const route = isDirect
    ? t("confirm.route.instant")
    : payAsset.chain === "ethereum"
      ? `${t("confirm.route.bridge")}${preview.etaSec ? ` · ~${Math.round(preview.etaSec / 60)} min` : ""}${preview.feeUsd ? ` · ${t("confirm.route.fee")} ~${money(preview.feeUsd)}` : ""}`
      : t("confirm.route.swap");

  // What you'll end up with, net of any conversion.
  const get = held
    ? swapIn.quoting
      ? t("deposit.quoting")
      : swapIn.valueUsd !== null
        ? `≈ ${money(swapIn.valueUsd)} ${view.assetSymbol}`
        : "—"
    : isDirect
      ? `${money(usdAmount)} ${view.assetSymbol}`
      : preview.quoting
        ? t("deposit.quoting")
        : preview.netUsdc !== null
          ? `≈ ${money(preview.netUsdc)} ${view.assetSymbol}`
          : "—";
  const swapCost = held && swapIn.spreadUsd && swapIn.spreadUsd > 0 ? swapIn.spreadUsd : null;

  return (
    <div>
      <p className="text-[10px] lowercase tracking-wide text-black/40 mb-2">{t("confirm.review", { verb: verb.toLowerCase() })}</p>

      <div className="divide-y divide-black/5">
        <Row k={t("confirm.youPay")} v={`${money(usdAmount)} · ${payAsset.symbol}`} />
        <Row k={held ? t("confirm.youllHold") : t("confirm.youllGet")} v={get} />
        {swapCost !== null && <Row k={t("confirm.swapCostOneTime")} v={`~${money(swapCost)}`} />}
        <Row k={t("confirm.route")} v={route} />
        <Row k={t("confirm.whereItGoes")} v={held ? t("confirm.ownWallet") : view.name} />
      </div>

      {isBridge && (
        <div className="mt-3 rounded-[8px] border border-black/10 px-3 py-2.5">
          <BridgeSteps steps={bridgeSteps} status={busy ? status : "idle"} />
          <p className="mt-1.5 text-[10px] lowercase tracking-wide text-black/40">{t("confirm.step.hint")}</p>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-snug text-black/45">
        {t("confirm.footer")}
      </p>

      {error && <p className="mt-3 text-xs text-red-500 text-center">{localizeError(error, t)}</p>}

      <button
        onClick={onConfirm}
        disabled={busy}
        className="mt-4 w-full px-4 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
      >
        {busy ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            {label}
          </>
        ) : (
          `${t("confirm.confirm", { verb: verb.toLowerCase() })}`
        )}
      </button>
      <button
        onClick={onBack}
        disabled={busy}
        className="mt-2 w-full py-2 text-[12px] lowercase tracking-wide text-black/45 hover:text-black/70 disabled:opacity-30 transition"
      >
        {t("confirm.back")}
      </button>
    </div>
  );
}
