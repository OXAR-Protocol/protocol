"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { VaultConfig } from "@/lib/constants";
import { VaultAccount } from "@/hooks/use-vaults";
import { bnToDecimal, formatApy, formatUsdc, getMaturityCountdown } from "@/lib/format";

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

function MiniYieldChart({ apy, bankRate }: { apy: number; bankRate: number }) {
  const months = 12;
  const points = Array.from({ length: months + 1 }, (_, i) => i);
  const w = 280;
  const h = 50;
  const padX = 0;
  const padY = 4;

  const oxarValues = points.map((m) => 1000 * (1 + apy / 100 * m / 12));
  const bankValues = points.map((m) => 1000 * (1 + bankRate / 100 * m / 12));

  const maxVal = Math.max(...oxarValues);
  const minVal = 1000;
  const range = maxVal - minVal || 1;

  const toX = (i: number) => padX + (i / months) * (w - padX * 2);
  const toY = (val: number) => h - padY - ((val - minVal) / range) * (h - padY * 2);

  const oxarPath = points.map((i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(oxarValues[i])}`).join(" ");
  const bankPath = points.map((i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(bankValues[i])}`).join(" ");

  const oxarArea = `${oxarPath} L${toX(months)},${h} L${toX(0)},${h} Z`;

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[50px]" preserveAspectRatio="none">
        <path d={oxarArea} fill="rgba(139,92,246,0.08)" />
        <path d={bankPath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3,3" />
        <path d={oxarPath} fill="none" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
        <circle cx={toX(months)} cy={toY(oxarValues[months])} r="2" fill="#8B5CF6" />
      </svg>
      <div className="flex items-center gap-3 mt-1">
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 rounded-full bg-accent/60" />
          <span className="font-mono text-[10px] text-white/30">OXAR</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 rounded-full bg-white/15 border-dashed" />
          <span className="font-mono text-[10px] text-white/20">Bank</span>
        </div>
      </div>
    </div>
  );
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

  // Progress: ratio of deposits to a soft cap (e.g. 100k). Use safe BN math — totalDeposits can overflow Number on big vaults.
  const depositRatio = vaultData
    ? Math.min(bnToDecimal(vaultData.account.totalDeposits, 6) / 100_000, 1)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/vault/${config.id}`}>
        <div className={`relative bg-surface-1 rounded-xl border border-white/[0.08] p-4 hover:border-accent/30 transition-all duration-200 ${
          config.apy >= 10 ? "shadow-[0_0_40px_rgba(139,92,246,0.06)]" : ""
        }`}>
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
              <p className="text-accent font-mono text-3xl font-bold">{apy}</p>
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

          <MiniYieldChart
            apy={config.apy}
            bankRate={config.denomination === "UAH" ? 3 : config.denomination === "USD" ? 0.5 : 0.3}
          />
        </div>
      </Link>
    </motion.div>
  );
}
