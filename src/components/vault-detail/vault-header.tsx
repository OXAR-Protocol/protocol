"use client";

import { VaultConfig } from "@/lib/constants";
import { VaultAccount } from "@/hooks/use-vaults";
import { formatApy, formatUsdc } from "@/lib/format";

interface VaultHeaderProps {
  config: VaultConfig;
  vault: VaultAccount | null;
}

function getSubtypeLabel(config: VaultConfig): string {
  if (config.isWar) return "War Bond";
  if (config.assetSubtype === "SHORT") return "OVDP Short-term";
  if (config.assetSubtype === "MID") return "OVDP Mid-term";
  return "OVDP Standard";
}

function getMaturityRange(config: VaultConfig): string {
  if (config.assetSubtype === "SHORT") return "3-12mo";
  if (config.assetSubtype === "MID") return "1-3yr";
  return "1-5yr";
}

export function VaultHeader({ config, vault }: VaultHeaderProps) {
  const apyDisplay = vault
    ? formatApy(vault.account.apyBps)
    : `${config.apy.toFixed(1)}%`;

  const depositsDisplay = vault
    ? `${formatUsdc(vault.account.totalDeposits)} deposited`
    : "$0.00 deposited";

  return (
    <div className="mt-8 mb-6 text-center">
      <p className="text-white font-sans text-lg">
        Government Bond {config.denomination}
      </p>
      <p className="text-white/40 font-mono text-xs mt-1">
        {getSubtypeLabel(config)} &middot; {config.denomination} &middot;{" "}
        {getMaturityRange(config)}
      </p>

      <p className="text-5xl font-mono font-bold text-accent mt-6">
        {apyDisplay}
      </p>
      <p className="text-white/30 font-mono text-xs uppercase mt-1">APY</p>

      <p className="text-white/30 font-mono text-xs mt-4">{depositsDisplay}</p>
    </div>
  );
}
