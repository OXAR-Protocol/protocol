"use client";

import { ArrowUpRight } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

import { usePersonalVault } from "@/hooks/use-personal-vault";
import type { YieldSourceConfig } from "@oxar/sdk";

const CHAIN_LABEL: Record<string, string> = {
  solana: "Solana",
  ethereum: "Ethereum",
};

const RISK_TONE: Record<string, string> = {
  low: "text-emerald-300/80",
  medium: "text-amber-300/80",
  high: "text-rose-300/80",
};

const RISK_LABEL: Record<string, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

interface Props {
  source: YieldSourceConfig;
  onOpen: () => void;
}

export function YieldSourceRow({ source, onOpen }: Props) {
  const vault = usePersonalVault(source.id);

  const myValue = !vault.totalShares.isZero()
    ? vault.totalShares.mul(vault.navPerShare).div(new BN(1_000_000)).toNumber() / 1_000_000
    : 0;

  return (
    <button
      onClick={onOpen}
      disabled={!source.available && !vault.exists}
      className={`group w-full text-left p-5 rounded-[8px] border transition ${
        source.available || vault.exists
          ? "border-white/10 hover:border-white/30"
          : "border-white/5 opacity-60 cursor-not-allowed"
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <p className="font-sans text-base text-white truncate">
              {source.name}
            </p>
            <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
              {CHAIN_LABEL[source.chain] ?? source.chain}
            </span>
            {!source.available && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-white/30">
                · soon
              </span>
            )}
            {vault.exists && (
              <span className="font-mono text-[10px] uppercase tracking-wide text-accent">
                · you're in
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-xs text-white/40 truncate">
            {source.description}
          </p>
          {vault.exists && myValue > 0 && (
            <p className="mt-2 font-mono text-[11px] text-white/50">
              your position: ${myValue.toFixed(2)}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="font-sans text-xl text-white tabular-nums">
            {source.baseApy.toFixed(1)}%
          </p>
          <p
            className={`font-mono text-[10px] uppercase tracking-wide ${
              RISK_TONE[source.riskLevel] ?? "text-white/50"
            }`}
          >
            {RISK_LABEL[source.riskLevel] ?? source.riskLevel}
          </p>
        </div>

        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          className="text-white/30 group-hover:text-white transition shrink-0"
        />
      </div>
    </button>
  );
}
