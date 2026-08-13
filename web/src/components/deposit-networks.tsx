"use client";

import { ChevronRight } from "lucide-react";

import { DEST_CHAINS } from "@/lib/wallet/outbound-destinations";
import { useT } from "@/lib/i18n";

/**
 * Which network the money is coming from.
 *
 * Solana is the one we can answer with an address, because the account IS a Solana
 * wallet — there is no Base account of ours to publish. The other networks are
 * listed anyway, and picking one is honest about what has to happen instead: the
 * money bridges, and today that means paying from a wallet you hold there.
 *
 * When Privy's deposit addresses (Relay) are switched on, each of these gets its
 * own address and this screen stops being a fork in the road.
 */
export function DepositNetworks({
  onSolana,
  onBridged,
}: {
  onSolana: () => void;
  onBridged: (label: string) => void;
}) {
  const { t } = useT();

  const row =
    "flex w-full items-center gap-3 rounded-[10px] border border-black/12 px-4 py-3.5 text-left transition hover:border-black/40";

  return (
    <div>
      <p className="mb-3 text-[12px] leading-snug text-black/50">{t("fund.network.hint")}</p>
      <div className="flex flex-col gap-2">
        {DEST_CHAINS.map((chain) => {
          const isSolana = chain.chain === "solana";
          return (
            <button
              key={chain.key}
              type="button"
              onClick={() => (isSolana ? onSolana() : onBridged(chain.label))}
              className={row}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] text-black">{chain.label}</span>
                {isSolana && (
                  <span className="block text-[12px] text-black/45">{t("fund.network.direct")}</span>
                )}
              </span>
              <ChevronRight size={15} strokeWidth={1.5} className="shrink-0 text-black/30" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
