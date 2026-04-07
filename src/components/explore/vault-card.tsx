"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { VaultConfig } from "@/lib/constants";
import { VaultAccount } from "@/hooks/use-vaults";
import { formatApy, formatUsdc, getMaturityCountdown } from "@/lib/format";

interface VaultCardProps {
  config: VaultConfig;
  vaultData?: VaultAccount;
  index: number;
}

function getTermLabel(subtype: string): string {
  switch (subtype) {
    case "SHORT": return "3-12mo";
    case "MID": return "1-3yr";
    case "WAR": return "War Bond";
    default: return "Standard";
  }
}

function getTypeLine(config: VaultConfig): string {
  if (config.isWar) return "War Bond";
  return `OVDP ${config.assetSubtype === "SHORT" ? "Short-term" : config.assetSubtype === "MID" ? "Mid-term" : "Standard"}`;
}

function getNameLine(config: VaultConfig): string {
  return `Government Bond ${config.denomination}`;
}

export function VaultCard({ config, vaultData, index }: VaultCardProps) {
  const apy = vaultData
    ? formatApy(vaultData.account.apyBps)
    : `${config.apy.toFixed(1)}%`;

  const totalDeposits = vaultData
    ? formatUsdc(vaultData.account.totalDeposits)
    : "$0.00";

  const maturity = vaultData
    ? getMaturityCountdown(vaultData.account.maturityTs)
    : null;

  const hasDeposits = vaultData
    ? !vaultData.account.totalDeposits.isZero()
    : false;

  // Progress: ratio of deposits to a soft cap (e.g. 100k)
  const depositRatio = vaultData
    ? Math.min(vaultData.account.totalDeposits.toNumber() / (100_000 * 1_000_000), 1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/vault/${config.id}`}>
        <div className="bg-surface-1 rounded-xl border border-white/[0.08] p-4 hover:border-accent/30 transition-all duration-200">
          {/* Top row: flag + name | APY */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white font-sans text-base">
                <span className="mr-1.5">&#x1F1FA;&#x1F1E6;</span>
                {getNameLine(config)}
              </p>
              <p className="text-white/40 font-mono text-xs mt-0.5">
                {getTypeLine(config)}
              </p>
            </div>
            <div className="text-right shrink-0 ml-3">
              <p className="text-accent font-mono text-2xl font-bold">{apy}</p>
              <p className="text-white/30 font-mono text-xs">APY</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.08] my-3" />

          {/* Bottom row: denomination, term, deposits */}
          <div className="flex items-center gap-2 text-white/30 font-mono text-xs">
            <span>{config.denomination}</span>
            <span>&middot;</span>
            <span>{getTermLabel(config.assetSubtype)}</span>
            <span>&middot;</span>
            <span>{totalDeposits} deposited</span>
          </div>

          {/* Progress bar */}
          {hasDeposits && (
            <div className="mt-2 h-1 rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-accent/40"
                style={{ width: `${depositRatio * 100}%` }}
              />
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
