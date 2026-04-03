"use client";

import Link from "next/link";
import { BN } from "@coral-xyz/anchor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VaultConfig } from "@/lib/constants";
import { VaultAccount } from "@/hooks/use-vaults";

function formatUsdc(amount: BN): string {
  const val = amount.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
}

function formatNav(navPerShare: BN): string {
  const val = navPerShare.toNumber() / 1_000_000;
  return `$${val.toFixed(6)}`;
}

function formatApy(apyBps: BN): string {
  const val = apyBps.toNumber() / 100;
  return `${val.toFixed(1)}%`;
}

function getMaturityCountdown(maturityTs: BN): string {
  const now = Date.now() / 1000;
  const maturity = maturityTs.toNumber();
  const diff = maturity - now;

  if (diff <= 0) return "Matured";

  const days = Math.floor(diff / 86400);
  if (days > 365) {
    const years = Math.floor(days / 365);
    const remainDays = days % 365;
    return `${years}y ${remainDays}d`;
  }
  if (days > 0) return `${days}d`;

  const hours = Math.floor(diff / 3600);
  return `${hours}h`;
}

interface VaultCardProps {
  config: VaultConfig;
  vaultData?: VaultAccount;
}

export function VaultCard({ config, vaultData }: VaultCardProps) {
  const apy = vaultData
    ? formatApy(vaultData.account.apyBps)
    : `${config.apy.toFixed(1)}%`;
  const nav = vaultData
    ? formatNav(vaultData.account.navPerShare)
    : "$1.000000";
  const totalDeposits = vaultData
    ? formatUsdc(vaultData.account.totalDeposits)
    : "$0.00";
  const maturity = vaultData
    ? getMaturityCountdown(vaultData.account.maturityTs)
    : "N/A";
  const isActive = vaultData ? vaultData.account.isActive : false;

  return (
    <Link href={`/vault/${config.id}`}>
      <Card className="border-gray-800 bg-gray-900 transition-all hover:border-gray-600 hover:bg-gray-900/80 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-white">
              {config.label}
            </CardTitle>
            <div className="flex gap-1.5">
              {config.isWar && (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30">
                  WAR
                </Badge>
              )}
              {config.hasFxRisk && (
                <Badge variant="outline" className="border-yellow-500/40 text-yellow-400">
                  FX Risk
                </Badge>
              )}
              {isActive && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  Active
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 font-mono">{config.id}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center">
            <p className="text-4xl font-bold text-[#00D4AA]">{apy}</p>
            <p className="text-xs text-gray-500 mt-1">APY</p>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-800">
            <div>
              <p className="text-xs text-gray-500">NAV/Share</p>
              <p className="text-sm font-medium text-gray-200">{nav}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Deposits</p>
              <p className="text-sm font-medium text-gray-200">{totalDeposits}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Maturity</p>
              <p className="text-sm font-medium text-gray-200">{maturity}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
