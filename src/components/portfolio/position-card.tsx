"use client";

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Loader2 } from "lucide-react";

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
  claiming: boolean;
  onClaim: (vaultPubkey: PublicKey) => void;
}

export function PositionCard({ position, claiming, onClaim }: PositionCardProps) {
  const config = findVaultConfig(position.vault.publicKey.toBase58());
  const value = position.balance
    .mul(position.vault.account.navPerShare)
    .div(new BN(1_000_000));
  const maturity = getMaturityCountdown(position.vault.account.maturityTs);

  const denomination = config?.denomination ?? "UAH";
  const { color, rgb } = getBondColor(denomination);

  return (
    <div
      className="rounded-[5px] border border-white/10 bg-surface-0 p-5 transition-colors hover:border-white/20"
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
          <>
            <span
              className="font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded"
              style={{ color, background: `rgba(${rgb},0.1)` }}
            >
              Matured
            </span>
            <button
              onClick={() => onClaim(position.vault.publicKey)}
              disabled={claiming}
              className="font-mono text-[10px] uppercase tracking-[0.15em] px-4 py-2 rounded-[5px] bg-white text-black hover:bg-white/90 disabled:bg-white/[0.04] disabled:text-white/30 transition-colors flex items-center gap-2"
            >
              {claiming ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Claiming
                </>
              ) : (
                "Claim"
              )}
            </button>
          </>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-wide text-white/40">
            {maturity.text}
          </span>
        )}
      </div>
    </div>
  );
}
