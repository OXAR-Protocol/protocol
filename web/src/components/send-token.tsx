"use client";

import { formatUsdAmount, type WalletAsset } from "@oxar/sdk";

import { SheetRow } from "@/components/sheet-row";
import { TokenIcon } from "@/components/token-icon";
import { maxSendable } from "@/lib/wallet/transfer";
import { USDC_MINT } from "@/lib/constants";
import { useT } from "@/lib/i18n";

/**
 * Everything the wallet can send, dollars first.
 *
 * Sorted by what it's worth, not alphabetically — the thing you meant is almost
 * always the biggest one, and USDC leads because a send is usually a payment.
 */
export function SendToken({
  assets,
  activeMint,
  onPick,
}: {
  assets: readonly WalletAsset[];
  activeMint: string | null;
  onPick: (mint: string) => void;
}) {
  const { t } = useT();

  const sendable = assets
    .filter((a) => a.chain === "solana" && maxSendable(a) > BigInt(0))
    .sort((a, b) => (a.mint === USDC_MINT ? -1 : b.mint === USDC_MINT ? 1 : b.usdValue - a.usdValue));

  if (!sendable.length) return <p className="text-[13px] text-black/45">{t("send.noAssets")}</p>;

  return (
    <div className="flex flex-col gap-2">
      {sendable.map((a) => (
        <SheetRow
          key={a.mint}
          leading={<TokenIcon asset={a} className="h-10 w-10 shrink-0 rounded-full" />}
          title={a.symbol}
          body={`${Number((Number(maxSendable(a)) / 10 ** a.decimals).toPrecision(6))} ${a.symbol}`}
          badge={a.mint === activeMint ? t("send.token.selected") : undefined}
          trailing={
            <span className="shrink-0 text-[14px] tabular-nums text-black">${formatUsdAmount(a.usdValue)}</span>
          }
          onClick={() => onPick(a.mint)}
        />
      ))}
    </div>
  );
}
