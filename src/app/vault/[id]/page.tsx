"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useVault } from "@/hooks/use-vault";
import { useDeposit } from "@/hooks/use-deposit";
import { getVaultConfigById, parseVaultId } from "@/lib/constants";

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

function formatShares(shares: BN): string {
  const val = shares.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(val);
}

function getMaturityDate(maturityTs: BN): string {
  const date = new Date(maturityTs.toNumber() * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getMaturityCountdown(maturityTs: BN): string {
  const now = Date.now() / 1000;
  const maturity = maturityTs.toNumber();
  const diff = maturity - now;
  if (diff <= 0) return "Matured";
  const days = Math.floor(diff / 86400);
  if (days > 0) return `${days} days remaining`;
  const hours = Math.floor(diff / 3600);
  return `${hours} hours remaining`;
}

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;
  const config = getVaultConfigById(vaultId);
  const parsed = parseVaultId(vaultId);

  const { vault, vaultPda, loading, error } = useVault(
    parsed.region,
    parsed.denomination,
    parsed.assetSubtype
  );
  const { deposit, loading: depositing, error: depositError } = useDeposit();

  const [depositAmount, setDepositAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-gray-400">Vault not found.</p>
        </main>
      </div>
    );
  }

  const handleDeposit = async () => {
    if (!vaultPda || !depositAmount) return;
    const amountFloat = parseFloat(depositAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) return;

    const amountBn = new BN(Math.floor(amountFloat * 1_000_000));
    const tx = await deposit(vaultPda, amountBn);
    if (tx) {
      setTxHash(tx);
      setDepositAmount("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-gray-400 hover:text-white transition-colors"
        >
          &larr; Back to Vaults
        </button>

        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">{config.label}</h1>
          {config.isWar && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              WAR
            </Badge>
          )}
          {config.hasFxRisk && (
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-400">
              FX Risk
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-[#00D4AA]" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
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
                          {getMaturityCountdown(vault.account.maturityTs)}
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

            <div>
              <Card className="border-gray-800 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-white">Deposit USDC</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!vault ? (
                    <p className="text-sm text-gray-500">
                      Deposits are unavailable until the vault is initialized on-chain.
                    </p>
                  ) : (
                    <>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">
                          Amount (USDC)
                        </label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <Button
                        onClick={handleDeposit}
                        disabled={depositing || !depositAmount}
                        className="w-full bg-[#00D4AA] text-gray-950 font-semibold hover:bg-[#00B892] disabled:opacity-50"
                      >
                        {depositing ? "Processing..." : "Deposit"}
                      </Button>

                      {depositError && (
                        <p className="text-xs text-red-400">{depositError}</p>
                      )}

                      {txHash && (
                        <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3">
                          <p className="text-xs text-emerald-400">Deposit successful!</p>
                          <p className="text-xs text-gray-500 font-mono mt-1 break-all">
                            {txHash}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
