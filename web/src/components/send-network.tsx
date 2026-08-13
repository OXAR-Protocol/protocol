"use client";

import { AssetIcon } from "@/components/asset-icon";
import { SheetRow } from "@/components/sheet-row";
import { destChainsFor } from "@/lib/wallet/outbound-destinations";
import { useT } from "@/lib/i18n";

/** Chain logos ship with the app, like the asset ones. `key` is the destination's. */
const chainLogo = (key: string) => `/logos/chains/${key}.png`;

/**
 * Which network the money is going to — asked FIRST, before the address.
 *
 * An address is chain-shaped: the same 0x… string exists on five networks and means
 * a different account's money on each. Asking for the address first and the network
 * after invites pasting one and picking the wrong other. So the network is chosen,
 * then the field knows what a valid address even looks like.
 */
export function SendNetwork({
  mint,
  symbol,
  onPick,
}: {
  /** Which holding is going — it decides which networks can even be offered. */
  mint: string;
  symbol: string;
  onPick: (key: string) => void;
}) {
  const { t } = useT();
  const chains = destChainsFor(mint);
  const solanaOnly = chains.length === 1;

  return (
    <>
      <p className="mb-3 text-[13px] leading-snug text-black/50">
        {solanaOnly ? t("send.network.solanaOnly", { sym: symbol }) : t("send.network.hint")}
      </p>
      <div className="flex flex-col gap-2">
        {chains.map((d) => (
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
