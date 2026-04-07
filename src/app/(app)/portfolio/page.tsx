"use client";

import { useEffect, useState, useCallback } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { usePortfolio } from "@/hooks/use-portfolio";
import { useClaim } from "@/hooks/use-claim";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { PositionCard } from "@/components/portfolio/position-card";
import { EmptyPortfolio } from "@/components/portfolio/empty-portfolio";
import { TestTokensCard } from "@/components/portfolio/test-tokens-card";

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

  const handleClaim = async (vaultPubkey: PublicKey) => {
    const tx = await claim(vaultPubkey);
    if (tx) refetch();
  };

  const totalValue = positions.reduce((acc, pos) => {
    const navPerShare = pos.vault.account.navPerShare;
    const value = pos.balance.mul(navPerShare).div(new BN(1_000_000));
    return acc.add(value);
  }, new BN(0));

  return (
    <div className="py-6 space-y-6">
      {!walletAddress ? (
        <p className="text-white/40 font-mono text-sm text-center py-20">
          Connect wallet to view portfolio
        </p>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      ) : positions.length > 0 ? (
        <>
          <PortfolioHeader totalValue={totalValue} positions={positions} />
          <div className="flex flex-col gap-3">
            {positions.map((pos) => (
              <PositionCard
                key={pos.tokenAccount.toBase58()}
                position={pos}
                claiming={claiming}
                onClaim={handleClaim}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyPortfolio />
      )}

      {walletAddress && (
        <TestTokensCard
          airdropping={airdropping}
          airdropMsg={airdropMsg}
          faucetLoading={faucetLoading}
          faucetMsg={faucetMsg}
          onAirdropSol={handleAirdropSol}
          onFaucet={handleFaucet}
        />
      )}
    </div>
  );
}
