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

  const enabled = hasAmount && !loading && !!vaultPda;
  const buttonClass = enabled
    ? "bg-white text-black hover:bg-white/90"
    : "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/5";

  return (
    <div className="sticky bottom-20 z-10 bg-black pt-4">
      <button
        onClick={handleClick}
        disabled={!enabled}
        className={`w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 ${buttonClass}`}
      >
        {loading && (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {buttonLabel}
      </button>
      {error && (
        <div className="rounded-[5px] border border-loss/30 bg-loss/[0.05] px-4 py-3 mt-3">
          <p className="font-mono text-[11px] text-loss">{error}</p>
        </div>
      )}
    </div>
  );
}
