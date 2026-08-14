"use client";

import { AssetIcon } from "@/components/asset-icon";
import { SheetRow } from "@/components/sheet-row";
import { DEST_CHAINS } from "@/lib/wallet/outbound-destinations";
import { useT } from "@/lib/i18n";

/** Chain logos ship with the app, like the asset ones. `key` is the destination's. */
const chainLogo = (key: string) => `/logos/chains/${key}.png`;

/**
 * Where the money is going — the first question, and the one that decides the rest.
 *
 * It comes before the token because it prunes rather than gets pruned: choosing
 * Base leaves three things worth sending, and the list that follows shows exactly
 * those. The other order works too, right up until someone picks gold and the
 * networks quietly collapse to one — a choice that disappears reads as a bug.
 *
 * It also comes before the address, which is chain-shaped: the same 0x… string
 * exists on five networks and means a different account's money on each.
 */
export function SendNetwork({ onPick }: { onPick: (key: string) => void }) {
  const { t } = useT();

  return (
    <>
      <p className="mb-3 text-[13px] leading-snug text-black/50">{t("send.network.hint")}</p>
      <div className="flex flex-col gap-2">
        {DEST_CHAINS.map((d) => (
          <SheetRow
            key={d.key}
            leading={<AssetIcon src={chainLogo(d.key)} label={d.label} size={40} />}
            title={d.label}
            body={
              d.chain === "solana"
                ? t("send.network.instant")
                : t("send.network.bridged", { sym: d.assets[0]!.symbol })
            }
            onClick={() => onPick(d.key)}
          />
        ))}
      </div>
    </>
  );
}
