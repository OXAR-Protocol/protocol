"use client";

import { AlertTriangle } from "lucide-react";

import { assetNetworkLabel, type OriginGasStatus, type WalletAsset } from "@oxar/sdk";

import { useT } from "@/lib/i18n";

/**
 * Who pays the network fee on the chain the money is leaving from.
 *
 * Users read "gasless" and reasonably assume it covers the whole journey. It covers
 * the Solana half — our relayer pays that, so an empty SOL balance is fine. The other
 * half is an ordinary transaction from their own wallet on Ethereum, Base, Arbitrum,
 * Optimism or Polygon, and it costs that chain's own coin. Dollars can't pay it.
 *
 * So this says two different things depending on whether they can afford it:
 * short → a warning naming the coin and the chain; fine → one quiet line stating
 * which side pays what, on the review screen where surprises are supposed to die.
 */
export function OriginGasNote({
  status,
  payAsset,
}: {
  status: OriginGasStatus;
  /** Only used for the chain's display name ("Base", "Polygon"). */
  payAsset: WalletAsset | null;
}) {
  const { t } = useT();
  if (status.kind === "ok" || !payAsset) return null;

  const chain = assetNetworkLabel(payAsset) || status.network;
  const needed = `$${status.neededUsd.toFixed(2)}`;

  return (
    <div className="mt-2 flex items-start gap-2 rounded-[8px] border border-[#a35b00]/25 bg-[#a35b00]/[0.05] px-3 py-2">
      <AlertTriangle size={13} strokeWidth={1.5} className="mt-0.5 shrink-0 text-[#a35b00]" />
      <p className="text-[11px] leading-snug text-[#a35b00]">
        {status.kind === "missing"
          ? t("gas.missing", { chain, sym: status.symbol, usd: needed })
          : t("gas.low", {
              chain,
              sym: status.symbol,
              usd: needed,
              have: `$${status.haveUsd.toFixed(2)}`,
            })}
      </p>
    </div>
  );
}

/** The neutral version: states who pays which side, whether or not they're short. */
export function OriginGasSplit({ payAsset }: { payAsset: WalletAsset | null }) {
  const { t } = useT();
  if (!payAsset || payAsset.chain !== "ethereum") return null;
  const chain = assetNetworkLabel(payAsset) || "";
  return (
    <p className="mt-2 text-[11px] leading-snug text-black/45">
      {t("gas.split", { chain })}
    </p>
  );
}
