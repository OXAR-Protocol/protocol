"use client";

import { ChevronRight, Globe, Loader2 } from "lucide-react";

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

  const row =
    "flex w-full items-center gap-3 rounded-[10px] border border-black/12 px-4 py-3.5 text-left transition hover:border-black/40 disabled:opacity-50";

  return (
    <div>
      <p className="mb-3 text-[12px] leading-snug text-black/50">{t("fund.network.hint")}</p>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={onSolana} className={row}>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] text-black">{t("fund.network.solana")}</span>
            <span className="block text-[12px] text-black/45">{t("fund.network.direct")}</span>
          </span>
          <ChevronRight size={15} strokeWidth={1.5} className="shrink-0 text-black/30" />
        </button>

        <button type="button" onClick={() => void open()} disabled={busy} className={row}>
          <Globe size={16} strokeWidth={1.5} className="shrink-0 text-black/45" />
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] text-black">{t("fund.network.elsewhere")}</span>
            <span className="block text-[12px] leading-snug text-black/45">
              {t("fund.network.bridged")}
            </span>
          </span>
          {busy ? (
            <Loader2 size={15} className="shrink-0 animate-spin text-black/30" />
          ) : (
            <ChevronRight size={15} strokeWidth={1.5} className="shrink-0 text-black/30" />
          )}
        </button>
      </div>

      {/* Whoever moves the money says what it costs and how long it takes — we don't
          set the route, so we don't promise its terms. */}
      <p className="mt-4 text-[11px] leading-snug text-black/40">{t("fund.network.disclosure")}</p>

      {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
