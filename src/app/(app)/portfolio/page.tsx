"use client";

import { BN } from "@coral-xyz/anchor";

import { usePortfolio } from "@/hooks/use-portfolio";
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
  const { refetch: refetchSolBalance } = useSolBalance();
  const {
    airdropSol,
    solLoading: airdropping,
    solMsg: airdropMsg,
    mintUsdc,
    usdcLoading: faucetLoading,
    usdcMsg: faucetMsg,
  } = useFaucet();

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
          <div className="flex flex-col gap-3">
            {positions.map((pos) => (
              <PositionCard key={pos.tokenAccount.toBase58()} position={pos} />
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
