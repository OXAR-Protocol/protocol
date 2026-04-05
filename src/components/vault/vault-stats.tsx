"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatUsdc, formatNav, formatApy, formatShares, getMaturityDate, getMaturityCountdown } from "@/lib/format";
import { VaultAccount } from "@/hooks/use-vaults";
import { VaultConfig } from "@/lib/constants";

interface VaultStatsProps {
  vault: VaultAccount | null;
  config: VaultConfig;
  parsed: { region: string; denomination: string; assetSubtype: string };
  error: string | null;
}

export function VaultStats({ vault, config, parsed, error }: VaultStatsProps) {
  return (
    <div className="space-y-6">
      {error && !vault && (
        <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-4 mb-4">
          <p className="text-sm text-yellow-400">
            Vault not initialized on-chain yet. Showing estimated data from configuration.
          </p>
          <p className="mt-1 text-xs text-gray-500 font-mono">{config.id}</p>
        </div>
      )}

      <Card className="border-gray-800 bg-gray-900">
        <CardHeader>
          <CardTitle className="text-white">Vault Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">APY</p>
              <p className="mt-1 text-2xl font-bold text-[#00D4AA]">
                {vault ? formatApy(vault.account.apyBps) : `${config.apy.toFixed(1)}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">NAV / Share</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {vault ? formatNav(vault.account.navPerShare) : "$1.000000"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Deposits</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {vault ? formatUsdc(vault.account.totalDeposits) : "$0.00"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Shares</p>
              <p className="mt-1 text-lg font-semibold text-gray-200">
                {vault ? formatShares(vault.account.totalShares) : "0"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Maturity</p>
              <p className="mt-1 text-lg font-semibold text-gray-200">
                {vault ? getMaturityDate(vault.account.maturityTs) : "N/A"}
              </p>
              {vault && (
                <p className="text-xs text-gray-500">
                  {getMaturityCountdown(vault.account.maturityTs).text}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Fee</p>
              <p className="mt-1 text-lg font-semibold text-gray-200">
                {vault ? `${(vault.account.feeBps / 100).toFixed(2)}%` : "N/A"}
              </p>
            </div>
          </div>

          <Separator className="my-6 bg-gray-800" />

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-500">Region</p>
              <p className="text-gray-300 font-mono">{vault ? vault.account.region : parsed.region}</p>
            </div>
            <div>
              <p className="text-gray-500">Denomination</p>
              <p className="text-gray-300 font-mono">{vault ? vault.account.denomination : parsed.denomination}</p>
            </div>
            <div>
              <p className="text-gray-500">Subtype</p>
              <p className="text-gray-300 font-mono">{vault ? vault.account.assetSubtype : parsed.assetSubtype}</p>
            </div>
            <div>
              <p className="text-gray-500">Status</p>
              {vault ? (
                <p className={vault.account.isActive ? "text-emerald-400" : "text-red-400"}>
                  {vault.account.isActive ? "Active" : "Inactive"}
                </p>
              ) : (
                <p className="text-gray-500">Not initialized</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
