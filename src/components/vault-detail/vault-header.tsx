"use client";

import { VaultConfig } from "@/lib/constants";
import { VaultAccount } from "@/hooks/use-vaults";
import { formatApy, formatUsdc } from "@/lib/format";
import { getBondName, getBondTermShort } from "@/lib/bond-labels";

interface VaultHeaderProps {
  config: VaultConfig;
  vault: VaultAccount | null;
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
        {getBondName(config)} &middot; {config.denomination} &middot;{" "}
        {getBondTermShort(config)}
      </p>

      <p className="text-5xl font-mono font-bold text-accent mt-6">
        {apyDisplay}
      </p>
      <p className="text-white/30 font-mono text-xs uppercase mt-1">APY</p>

      <p className="text-white/30 font-mono text-xs mt-4">{depositsDisplay}</p>
    </div>
  );
}
