"use client";

import { VaultConfig } from "@/lib/constants";
import { VaultAccount } from "@/hooks/use-vaults";
import {
  formatNav,
  formatUsdc,
  formatShares,
  getMaturityDate,
} from "@/lib/format";

interface VaultInfoProps {
  vault: VaultAccount | null;
  config: VaultConfig;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-white/[0.05]">
      <span className="text-white/40 font-mono text-xs">{label}</span>
      <span className="text-white font-mono text-sm">{value}</span>
    </div>
  );
}

export function VaultInfo({ vault, config }: VaultInfoProps) {
  const acc = vault?.account;

  const fee = acc
    ? `${(acc.feeBps / 100).toFixed(1)}%`
    : "N/A";

  const rows = [
    { label: "NAV/Share", value: acc ? formatNav(acc.navPerShare) : "$1.000000" },
    { label: "Total Deposits", value: acc ? formatUsdc(acc.totalDeposits) : "$0.00" },
    { label: "Total Shares", value: acc ? formatShares(acc.totalShares) : "0" },
    { label: "Maturity", value: acc ? getMaturityDate(acc.maturityTs) : "N/A" },
    { label: "Fee", value: fee },
    { label: "Status", value: acc?.isActive ? "Active" : "Inactive" },
    { label: "Region", value: config.region },
    { label: "Denomination", value: config.denomination },
    { label: "Type", value: config.assetSubtype },
  ];

  return (
    <div>
      <h3 className="text-white/60 font-mono text-xs uppercase tracking-wide mb-4">
        Details
      </h3>
      {rows.map((row) => (
        <InfoRow key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  );
}
