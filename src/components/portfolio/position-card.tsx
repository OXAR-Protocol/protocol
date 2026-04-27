"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

import { PortfolioPosition } from "@/hooks/use-portfolio";
import {
  formatUsdc,
  formatTokens,
  formatApy,
  getMaturityCountdown,
  findVaultConfig,
} from "@/lib/format";
import { getBondColor } from "@/lib/bond-constants";
import { getBondName, getBondTerm } from "@/lib/bond-labels";
import { TokenMark } from "@/components/explore/token-mark";

interface PositionCardProps {
  position: PortfolioPosition;
}

export function PositionCard({ position }: PositionCardProps) {
  const config = findVaultConfig(position.vault.publicKey.toBase58());
  const value = position.balance
    .mul(position.vault.account.navPerShare)
    .div(new BN(1_000_000));
  const maturity = getMaturityCountdown(position.vault.account.maturityTs);

  const denomination = config?.denomination ?? "UAH";
  const { color, rgb } = getBondColor(denomination);

  return (
    <Link
      href={`/portfolio/${position.vault.publicKey.toBase58()}`}
      className="rounded-[5px] border border-white/10 bg-surface-0 p-5 transition-colors hover:border-white/20 block"
      style={{ boxShadow: `0 0 40px rgba(${rgb},0.04)` }}
    >
      <div className="flex items-start gap-4">
        <TokenMark symbol={denomination} color={color} rgb={rgb} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-base text-white">ox{denomination}</span>
            {config?.isWar && (
              <span
                className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded"
                style={{ color, background: `rgba(${rgb},0.1)` }}
              >
                WAR
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] text-white/30 uppercase block truncate">
            {config ? getBondName(config) : "Government Bond"} &middot;{" "}
            {config ? getBondTerm(config) : "Stable"}
          </span>
        </div>
        <div className="text-right shrink-0">
          <span className="font-mono text-xl font-light text-white">
            {formatUsdc(value)}
          </span>
          <span className="font-mono text-[10px] text-white/25 block uppercase tracking-wide">
            Current value
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-4 font-mono text-xs">
        <div>
          <span className="text-white/30 text-[10px] uppercase tracking-wide block">
            Balance
          </span>
          <span className="text-white/80 mt-0.5 block">
            {formatTokens(position.balance)} tokens
          </span>
        </div>
        <div className="text-right">
          <span className="text-white/30 text-[10px] uppercase tracking-wide block">
            APY
          </span>
          <span className="mt-0.5 block" style={{ color }}>
            {formatApy(position.vault.account.apyBps)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
        {maturity.matured ? (
          <span
            className="font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded"
            style={{ color, background: `rgba(${rgb},0.1)` }}
          >
            Ready to claim
          </span>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wide text-white/40">
            {maturity.text}
          </span>
        )}
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 inline-flex items-center gap-1.5">
          View details
          <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
