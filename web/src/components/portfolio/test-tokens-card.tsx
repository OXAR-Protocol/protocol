"use client";

import { Loader2 } from "lucide-react";

interface TestTokensCardProps {
  airdropping: boolean;
  airdropMsg: string | null;
  faucetLoading: boolean;
  faucetMsg: string | null;
  onAirdropSol: () => void;
  onFaucet: () => void;
}

export function TestTokensCard({
  airdropping,
  airdropMsg,
  faucetLoading,
  faucetMsg,
  onAirdropSol,
  onFaucet,
}: TestTokensCardProps) {
  return (
    <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          Devnet Faucet
        </span>
        <span className="font-mono text-[10px] text-white/20">Test tokens</span>
      </div>

      <div className="flex flex-col gap-4">
        <FaucetRow
          label="Get 1 Test SOL"
          description="Required for transaction fees"
          loading={airdropping}
          message={airdropMsg}
          onClick={onAirdropSol}
        />
        <div className="h-px bg-white/[0.06]" />
        <FaucetRow
          label="Get 10,000 Test USDC"
          description="Rate limited to once per 5 minutes"
          loading={faucetLoading}
          message={faucetMsg}
          onClick={onFaucet}
        />
      </div>
    </div>
  );
}

function FaucetRow({
  label,
  description,
  loading,
  message,
  onClick,
}: {
  label: string;
  description: string;
  loading: boolean;
  message: string | null;
  onClick: () => void;
}) {
  const isSuccess = message?.includes("sent");

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-sm text-white truncate">{label}</p>
          <p className="font-mono text-[10px] text-white/30 uppercase tracking-wide mt-0.5">
            {description}
          </p>
        </div>
        <button
          onClick={onClick}
          disabled={loading}
          className="shrink-0 px-4 py-2 rounded-[5px] font-mono text-[10px] uppercase tracking-[0.15em] border border-white/10 text-white hover:border-white/20 hover:bg-white/[0.04] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={12} className="animate-spin" />
              Sending
            </>
          ) : (
            "Request"
          )}
        </button>
      </div>
      {message && (
        <p
          className={`font-mono text-[10px] ${
            isSuccess ? "text-profit" : "text-loss"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
