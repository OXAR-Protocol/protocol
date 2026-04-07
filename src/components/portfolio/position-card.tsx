"use client";

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { PortfolioPosition } from "@/hooks/use-portfolio";
import { formatUsdc, formatTokens, formatApy, getMaturityCountdown, findVaultConfig } from "@/lib/format";

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

  const label = config?.label ?? "Government Bond";

  return (
    <div className="bg-surface-1 rounded-xl border border-white/[0.08] p-4 space-y-3">
      {/* Top row: name + value */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white font-mono text-sm font-semibold">
            {"\u{1F1FA}\u{1F1E6}"} {label}
          </p>
          <p className="text-white/40 font-mono text-xs mt-0.5">
            {config?.isWar ? "War Bond" : "OVDP"}{" "}
            {config?.assetSubtype ?? ""}
          </p>
        </div>
        <p className="text-profit font-mono text-sm font-bold">
          {formatUsdc(value)}
        </p>
      </div>

      {/* Second row: tokens + APY */}
      <p className="text-white/40 font-mono text-xs">
        {formatTokens(position.balance)} tokens · {formatApy(position.vault.account.apyBps)} APY
      </p>

      {/* Third row: maturity + claim */}
      <div className="flex items-center gap-3">
        {maturity.matured ? (
          <>
            <span className="text-profit font-mono text-xs font-semibold px-2 py-1 rounded-md bg-profit/10">
              Matured ✓
            </span>
            <button
              onClick={() => onClaim(position.vault.publicKey)}
              disabled={claiming}
              className="bg-profit text-black px-4 py-2 rounded-lg font-mono text-sm font-semibold disabled:opacity-50 transition-opacity"
            >
              {claiming ? "Claiming..." : "Claim"}
            </button>
          </>
        ) : (
          <span className="text-white/30 font-mono text-xs px-2 py-1 rounded-md bg-white/5">
            {maturity.text}
          </span>
        )}
      </div>
    </div>
  );
}
