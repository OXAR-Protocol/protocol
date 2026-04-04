"use client";

import { useEffect, useState, useCallback } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useClaim } from "@/hooks/use-claim";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { VAULT_CONFIGS } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";

function formatUsdc(amount: BN): string {
  const val = amount.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
}

function formatTokens(amount: BN): string {
  const val = amount.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(val);
}

function formatApy(apyBps: BN): string {
  const val = apyBps.toNumber() / 100;
  return `${val.toFixed(1)}%`;
}

function getMaturityStatus(maturityTs: BN): { text: string; matured: boolean } {
  const now = Date.now() / 1000;
  const maturity = maturityTs.toNumber();
  if (maturity <= now) return { text: "Matured", matured: true };
  const days = Math.floor((maturity - now) / 86400);
  return { text: `${days}d remaining`, matured: false };
}

export default function PortfolioPage() {
  const { walletAddress, connection } = useOxarProgram();
  const { usdcBalance, positions, loading, refetch } = usePortfolio();
  const { claim, loading: claiming, error: claimError } = useClaim();
  const [solBalance, setSolBalance] = useState<number>(0);
  const [airdropping, setAirdropping] = useState(false);
  const [airdropMsg, setAirdropMsg] = useState<string | null>(null);
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetMsg, setFaucetMsg] = useState<string | null>(null);

  const fetchSolBalance = useCallback(async () => {
    if (!walletAddress || !connection) return;
    try {
      const bal = await connection.getBalance(walletAddress);
      setSolBalance(bal / LAMPORTS_PER_SOL);
    } catch {
      // ignore
    }
  }, [walletAddress, connection]);

  useEffect(() => {
    fetchSolBalance();
    const interval = setInterval(fetchSolBalance, 10000);
    return () => clearInterval(interval);
  }, [fetchSolBalance]);

  const handleAirdropSol = async () => {
    if (!walletAddress || !connection) return;
    setAirdropping(true);
    setAirdropMsg(null);
    try {
      const sig = await connection.requestAirdrop(walletAddress, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      setAirdropMsg("Airdropped 2 SOL successfully!");
      fetchSolBalance();
    } catch (err: any) {
      setAirdropMsg(err.message || "Airdrop failed. Are you on localnet/devnet?");
    } finally {
      setAirdropping(false);
    }
  };

  const handleFaucet = async () => {
    if (!walletAddress) return;
    setFaucetLoading(true);
    setFaucetMsg(null);
    try {
      const res = await fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress.toBase58() }),
      });
      const data = await res.json();
      if (data.success) {
        setFaucetMsg("10,000 test USDC sent! Refresh in a few seconds.");
        fetchSolBalance();
        setTimeout(() => refetch(), 3000);
      } else {
        setFaucetMsg(data.error || "Faucet failed");
      }
    } catch (err: any) {
      setFaucetMsg(err.message || "Faucet failed");
    } finally {
      setFaucetLoading(false);
    }
  };

  const handleClaim = async (vaultPubkey: any) => {
    const tx = await claim(vaultPubkey);
    if (tx) refetch();
  };

  const findVaultConfig = (vaultPubkey: string) => {
    for (const config of VAULT_CONFIGS) {
      const [pda] = deriveVaultPda(config.region, config.denomination, config.assetSubtype);
      if (pda.toBase58() === vaultPubkey) return config;
    }
    return undefined;
  };

  const totalValue = positions.reduce((acc, pos) => {
    const navPerShare = pos.vault.account.navPerShare;
    const value = pos.balance.mul(navPerShare).div(new BN(1_000_000));
    return acc.add(value);
  }, new BN(0));

  return (
    <div className="min-h-screen bg-gray-950">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Portfolio</h1>
          <p className="mt-2 text-gray-400">
            Your balances and vault positions.
          </p>
        </div>

        {!walletAddress ? (
          <Card className="border-gray-800 bg-gray-900">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400">Connect your wallet to view your portfolio.</p>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-[#00D4AA]" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">SOL Balance</p>
                  <p className="mt-2 text-3xl font-bold text-white">{solBalance.toFixed(4)}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">USDC Balance</p>
                  <p className="mt-2 text-3xl font-bold text-white">{formatUsdc(usdcBalance)}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Portfolio Value</p>
                  <p className="mt-2 text-3xl font-bold text-[#00D4AA]">{formatUsdc(totalValue)}</p>
                </CardContent>
              </Card>
              <Card className="border-gray-800 bg-gray-900">
                <CardContent className="pt-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Positions</p>
                  <p className="mt-2 text-3xl font-bold text-white">{positions.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Test Tokens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={handleAirdropSol}
                    disabled={airdropping}
                    size="sm"
                    className="bg-[#00D4AA] text-gray-950 font-semibold hover:bg-[#00B892] disabled:opacity-50"
                  >
                    {airdropping ? "Airdropping..." : "Get 2 Test SOL"}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Works on localnet and devnet. SOL is required for transaction fees.
                  </p>
                </div>
                {airdropMsg && (
                  <p className={`text-xs ${airdropMsg.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
                    {airdropMsg}
                  </p>
                )}
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleFaucet}
                    disabled={faucetLoading}
                    size="sm"
                    className="bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                  >
                    {faucetLoading ? "Sending..." : "Get 10,000 Test USDC"}
                  </Button>
                  <p className="text-xs text-gray-500">
                    Test USDC for deposits. Rate limited to once per 5 minutes.
                  </p>
                </div>
                {faucetMsg && (
                  <p className={`text-xs ${faucetMsg.includes("sent") ? "text-emerald-400" : "text-red-400"}`}>
                    {faucetMsg}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Your Positions</CardTitle>
              </CardHeader>
              <CardContent>
                {positions.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">
                    No positions yet. Deposit USDC into a vault to get started.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Vault</TableHead>
                          <TableHead className="text-gray-400 text-right">Tokens</TableHead>
                          <TableHead className="text-gray-400 text-right">NAV/Share</TableHead>
                          <TableHead className="text-gray-400 text-right">Value</TableHead>
                          <TableHead className="text-gray-400 text-right">APY</TableHead>
                          <TableHead className="text-gray-400">Maturity</TableHead>
                          <TableHead className="text-gray-400 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positions.map((pos) => {
                          const vaultConfig = findVaultConfig(
                            pos.vault.publicKey.toBase58()
                          );
                          const navPerShare = pos.vault.account.navPerShare;
                          const value = pos.balance
                            .mul(navPerShare)
                            .div(new BN(1_000_000));
                          const maturity = getMaturityStatus(
                            pos.vault.account.maturityTs
                          );

                          return (
                            <TableRow
                              key={pos.vault.publicKey.toBase58()}
                              className="border-gray-800"
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium text-gray-200">
                                    {vaultConfig?.label || "Unknown Vault"}
                                  </p>
                                  {vaultConfig?.isWar && (
                                    <Badge className="mt-1 bg-amber-500/20 text-amber-400 border-amber-500/30">
                                      WAR
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-gray-200">
                                {formatTokens(pos.balance)}
                              </TableCell>
                              <TableCell className="text-right text-gray-200">
                                ${(navPerShare.toNumber() / 1_000_000).toFixed(6)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-white">
                                {formatUsdc(value)}
                              </TableCell>
                              <TableCell className="text-right text-[#00D4AA]">
                                {formatApy(pos.vault.account.apyBps)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={maturity.matured ? "default" : "outline"}
                                  className={
                                    maturity.matured
                                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                      : "border-gray-600 text-gray-400"
                                  }
                                >
                                  {maturity.text}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleClaim(pos.vault.publicKey)
                                  }
                                  disabled={claiming || !maturity.matured}
                                  className={
                                    maturity.matured
                                      ? "bg-[#00D4AA] text-gray-950 hover:bg-[#00B892]"
                                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                  }
                                >
                                  {claiming ? "..." : "Claim"}
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {claimError && (
                  <p className="mt-4 text-xs text-red-400">{claimError}</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
