"use client";

import { Globe, Wallet } from "lucide-react";

import { SheetRow } from "@/components/sheet-row";
import { useDepositAddressFlow } from "@/hooks/use-deposit-address-flow";
import { useT } from "@/lib/i18n";

/**
 * Where the money is coming from.
 *
 * Two answers, not a list of chains. Solana is ours to answer with an address,
 * because the account IS a Solana wallet. Everything else — any other network, or
 * an exchange — goes through a deposit address issued for the occasion (Privy,
 * routed by Relay), and Privy's own screen asks which chain and which token, so
 * listing them here would only ask the same question twice.
 *
 * That second door covers what the bridge never could: money on an exchange, which
 * can't be connected as a wallet — you can only withdraw from it to an address.
 */
export function DepositNetworks({ onSolana }: { onSolana: () => void }) {
  const { t } = useT();
  const { open, busy, error } = useDepositAddressFlow();

  return (
    <div>
      <p className="mb-3 text-[12px] leading-snug text-black/50">{t("fund.network.hint")}</p>

      <div className="flex flex-col gap-2">
        <SheetRow
          icon={Wallet}
          title={t("fund.network.solana")}
          body={t("fund.network.direct")}
          onClick={onSolana}
        />
        <SheetRow
          icon={Globe}
          title={t("fund.network.elsewhere")}
          body={t("fund.network.bridged")}
          busy={busy}
          onClick={() => void open()}
        />
      </div>

      {/* Whoever moves the money says what it costs and how long it takes — we don't
          set the route, so we don't promise its terms. */}
      <p className="mt-4 text-[11px] leading-snug text-black/40">{t("fund.network.disclosure")}</p>

      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
