"use client";

import { useEffect, useState, useCallback } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Nav } from "@/components/nav";
import { usePortfolio } from "@/hooks/use-portfolio";
import { useClaim } from "@/hooks/use-claim";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { WalletMissing } from "@/components/portfolio/wallet-missing";
import { BalanceCards } from "@/components/portfolio/balance-cards";
import { TestTokensCard } from "@/components/portfolio/test-tokens-card";
import { PositionsTable } from "@/components/portfolio/positions-table";

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
  }, [fetchSolBalance]);

  const handleAirdropSol = async () => {
    if (!walletAddress) return;
    setAirdropping(true);
    setAirdropMsg(null);
    try {
      const res = await fetch("/api/faucet-sol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: walletAddress.toBase58() }),
      });
      const data = await res.json();
      if (data.success) {
        setAirdropMsg("1 SOL sent! Refresh in a few seconds.");
        setTimeout(() => fetchSolBalance(), 3000);
      } else {
        setAirdropMsg(data.error || "Failed to get SOL");
      }
    } catch (err: any) {
      setAirdropMsg(err.message || "Failed to get SOL");
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
          <WalletMissing />
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-[#00D4AA]" />
          </div>
        ) : (
          <div className="space-y-6">
            <BalanceCards
              solBalance={solBalance}
              usdcBalance={usdcBalance}
              totalValue={totalValue}
              positionsCount={positions.length}
            />

            <TestTokensCard
              airdropping={airdropping}
              airdropMsg={airdropMsg}
              faucetLoading={faucetLoading}
              faucetMsg={faucetMsg}
              onAirdropSol={handleAirdropSol}
              onFaucet={handleFaucet}
            />

            <PositionsTable
              positions={positions}
              claiming={claiming}
              claimError={claimError}
              onClaim={handleClaim}
            />
          </div>
        )}
      </main>
    </div>
  );
}
