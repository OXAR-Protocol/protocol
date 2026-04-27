"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { VaultAccount } from "@/hooks/use-vaults";
import { VaultConfig } from "@/lib/constants";
import { getMaturityDate } from "@/lib/format";
import { getBondColor } from "@/lib/bond-constants";
import { getBondIssuer, getBondName, getBondTermDays } from "@/lib/bond-labels";
import { TokenMark } from "@/components/explore/token-mark";
import { MaturityRing } from "@/components/marketplace/maturity-ring";

interface BondDetailViewProps {
  vault: VaultAccount | null;
  config: VaultConfig | null;
  /** Where the back link should point. Defaults to "/marketplace". */
  backHref?: string;
  backLabel?: string;
}

export function BondDetailView({
  vault,
  config,
  backHref = "/marketplace",
  backLabel = "Back to marketplace",
}: BondDetailViewProps) {
  const denomination = config?.denomination ?? "UAH";
  const { color, rgb } = getBondColor(denomination);

  const now = Math.floor(Date.now() / 1000);
  const maturityTs = vault?.account.maturityTs.toNumber() ?? 0;
  const daysRemaining =
    maturityTs > 0 ? Math.max(0, Math.floor((maturityTs - now) / 86400)) : 0;
  const matured = maturityTs > 0 && now >= maturityTs;
  const termDays = config ? getBondTermDays(config) : 365;
  const apyPct = vault ? vault.account.apyBps.toNumber() / 100 : config?.apy ?? 0;

  return (
    <>
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60 transition-colors"
      >
        <ArrowLeft size={12} />
        {backLabel}
      </Link>

      {/* Header card */}
      <div
        className="rounded-[5px] border border-white/10 bg-surface-0 p-6"
        style={{ boxShadow: `0 0 60px rgba(${rgb},0.05)` }}
      >
        <div className="flex items-center gap-4">
          <TokenMark symbol={denomination} color={color} rgb={rgb} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-sans text-2xl text-white">
                ox{denomination}
              </span>
              {config?.isWar && (
                <span
                  className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded"
                  style={{ color, background: `rgba(${rgb},0.1)` }}
                >
                  WAR
                </span>
              )}
            </div>
            <span className="font-mono text-[10px] text-white/40 uppercase tracking-wide block">
              {config ? getBondName(config) : "Government Bond"}
              {config && ` · Series ${config.series}`}
            </span>
          </div>
        </div>

        <p className="font-mono text-[11px] text-white/50 mt-4 leading-relaxed">
          Issued by{" "}
          <span className="text-white/80">
            {config ? getBondIssuer(config) : "Treasury"}
          </span>
          . Wrapped on-chain into a transferable token. Holders receive
          principal + accrued yield at maturity.
        </p>
      </div>

      {/* Maturity ring + details */}
      <div className="grid md:grid-cols-[auto_1fr] gap-6 rounded-[5px] border border-white/10 bg-surface-0 p-6">
        <div className="flex items-center justify-center md:justify-start">
          <MaturityRing
            daysRemaining={daysRemaining}
            termDays={termDays}
            apyPct={apyPct}
            color={color}
            rgb={rgb}
          />
        </div>

        <div className="flex flex-col justify-center gap-4 min-w-0">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block">
              Maturity date
            </span>
            <span className="font-sans text-lg text-white block mt-1 tabular-nums">
              {vault ? getMaturityDate(vault.account.maturityTs) : "—"}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block">
              {matured ? "Status" : "Time until government payout"}
            </span>
            <span className="font-sans text-lg text-white block mt-1">
              {matured
                ? "Ready to claim"
                : daysRemaining >= 1
                  ? `${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
                  : "Less than 1 day"}
            </span>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block">
              At maturity
            </span>
            <span className="font-mono text-[12px] text-white/60 mt-1 leading-relaxed block">
              State redeems each token at face value + accrued{" "}
              <span style={{ color }}>{apyPct.toFixed(1)}% APY</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
