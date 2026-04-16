"use client";

import { useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { usePortfolio } from "@/hooks/use-portfolio";
import { useClaim } from "@/hooks/use-claim";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { useSolBalance } from "@/hooks/use-sol-balance";
import { useFaucet } from "@/hooks/use-faucet";
import { PortfolioHeader } from "@/components/portfolio/portfolio-header";
import { PositionCard } from "@/components/portfolio/position-card";
import { EmptyPortfolio } from "@/components/portfolio/empty-portfolio";
import { TestTokensCard } from "@/components/portfolio/test-tokens-card";

export default function PortfolioPage() {
  const { walletAddress } = useOxarProgram();
  const { positions, loading, refetch } = usePortfolio();
  const { claim, loading: claiming, error: claimError } = useClaim();
  const { refetch: refetchSolBalance } = useSolBalance();
  const {
    airdropSol,
    solLoading: airdropping,
    solMsg: airdropMsg,
    mintUsdc,
    usdcLoading: faucetLoading,
    usdcMsg: faucetMsg,
  } = useFaucet();

  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  const handleAirdropSol = async () => {
    const ok = await airdropSol();
    if (ok) await refetchSolBalance();
  };

  const handleFaucet = async () => {
    const ok = await mintUsdc();
    if (ok) {
      await Promise.all([refetchSolBalance(), refetch()]);
    }
  };

  const handleClaim = async (vaultPubkey: PublicKey) => {
    setClaimMsg(null);
    const tx = await claim(vaultPubkey);
    if (tx) {
      setClaimMsg("Claim successful. Balance updated.");
      await refetch();
      setTimeout(() => setClaimMsg(null), 3000);
    }
  };

  const totalValue = positions.reduce((acc, pos) => {
    const navPerShare = pos.vault.account.navPerShare;
    const value = pos.balance.mul(navPerShare).div(new BN(1_000_000));
    return acc.add(value);
  }, new BN(0));

  return (
    <div className="max-w-[720px] mx-auto py-8 space-y-8">
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
          {claimError && (
            <div className="rounded-[5px] border border-loss/30 bg-loss/[0.05] px-4 py-3">
              <p className="font-mono text-[11px] text-loss">{claimError}</p>
            </div>
          )}
          {claimMsg && (
            <div className="rounded-[5px] border border-profit/30 bg-profit/[0.05] px-4 py-3">
              <p className="font-mono text-[11px] text-profit">{claimMsg}</p>
            </div>
          )}
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
