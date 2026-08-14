"use client";

import { formatUsdAmount, type WalletAsset } from "@oxar/sdk";

import { SheetRow } from "@/components/sheet-row";
import { TokenIcon } from "@/components/token-icon";
import { maxSendable } from "@/lib/wallet/transfer";
import { canLeaveSolana, type DestChain } from "@/lib/wallet/outbound-destinations";
import { USDC_MINT } from "@/lib/constants";
import { useT } from "@/lib/i18n";

/**
 * What can go to the network you picked, dollars first.
 *
 * Off Solana the list is short on purpose: a bridge carries money, and a tokenized
 * share, gold or a yield receipt has no market on the other side, so a quote either
 * fails or is itself the loss. Showing those and failing at the quote three screens
 * later would be a promise this flow can't keep.
 *
 * Sorted by what it's worth, not alphabetically — the thing you meant is almost
 * always the biggest one, and USDC leads because a send is usually a payment.
 */
export function SendToken({
  assets,
  chain,
  activeMint,
  onPick,
}: {
  assets: readonly WalletAsset[];
  /** Where it's going — off Solana, only money can make the trip. */
  chain: DestChain;
  activeMint: string | null;
  onPick: (mint: string) => void;
}) {
  const { t } = useT();
  const crossing = chain.chain !== "solana";

  const sendable = assets
    .filter((a) => maxSendable(a) > BigInt(0))
    .filter((a) => !crossing || canLeaveSolana(a.mint))
    .sort((a, b) => (a.mint === USDC_MINT ? -1 : b.mint === USDC_MINT ? 1 : b.usdValue - a.usdValue));

  if (!sendable.length) {
    return (
      <p className="text-[13px] leading-snug text-black/45">
        {crossing ? t("send.token.noneForChain", { chain: chain.label }) : t("send.noAssets")}
      </p>
    );
  }

  return (
    <>
      {crossing && (
        <p className="mb-3 text-[13px] leading-snug text-black/50">
          {t("send.token.arrivesAs", { sym: chain.assets[0]!.symbol, chain: chain.label })}
        </p>
      )}
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
    </>
  );
}
