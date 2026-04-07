"use client";

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { useDeposit } from "@/hooks/use-deposit";

interface InvestButtonProps {
  amount: string;
  vaultPda: PublicKey | null;
  onSuccess: (txHash: string) => void;
}

export function InvestButton({ amount, vaultPda, onSuccess }: InvestButtonProps) {
  const { deposit, loading, error } = useDeposit();

  const parsed = parseFloat(amount);
  const hasAmount = !isNaN(parsed) && parsed > 0;

  const handleClick = async () => {
    if (!vaultPda || !hasAmount) return;
    const amountBn = new BN(Math.floor(parsed * 1_000_000));
    const tx = await deposit(vaultPda, amountBn);
    if (tx) onSuccess(tx);
  };

  const buttonLabel = loading
    ? "Processing..."
    : hasAmount
      ? `Invest $${parsed.toLocaleString()}`
      : "Enter amount";

  const buttonClass = hasAmount && !loading
    ? "bg-accent text-white"
    : "bg-white/[0.05] text-white/30";

  return (
    <div className="sticky bottom-20 z-10 bg-black pt-4">
      <button
        onClick={handleClick}
        disabled={!hasAmount || loading || !vaultPda}
        className={`w-full py-4 rounded-xl font-mono text-base uppercase tracking-wide transition-colors ${buttonClass}`}
      >
        {loading && (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2 align-middle" />
        )}
        {buttonLabel}
      </button>
      {error && (
        <p className="text-loss text-xs font-mono mt-2">{error}</p>
      )}
    </div>
  );
}
