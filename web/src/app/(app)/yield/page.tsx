"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BN } from "@coral-xyz/anchor";
import { Loader2 } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { usePersonalVault, type TemplateKey } from "@/hooks/use-personal-vault";
import { useVaultActions } from "@/hooks/use-vault-actions";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useFaucet } from "@/hooks/use-faucet";
import { useOxarProgram } from "@/hooks/use-oxar-program";

interface Template {
  key: TemplateKey;
  emoji: string;
  label: string;
  description: string;
  apyLow: number;
  apyHigh: number;
  sources: string[];
}

const TEMPLATES: Template[] = [
  {
    key: "sleepy",
    emoji: "😴",
    label: "Sleepy",
    description: "Slow but steady — US Treasuries-backed",
    apyLow: 4,
    apyHigh: 6,
    sources: ["Ondo USDY", "Kamino USDC"],
  },
  {
    key: "walking",
    emoji: "🚶",
    label: "Walking",
    description: "Balanced — mix of credit and lending",
    apyLow: 6,
    apyHigh: 9,
    sources: ["Maple Syrup", "Kamino", "JLP"],
  },
  {
    key: "running",
    emoji: "🏃",
    label: "Running",
    description: "Loud — DeFi yield and perp LP",
    apyLow: 9,
    apyHigh: 14,
    sources: ["Ethena sUSDe", "JLP", "Drift"],
  },
];

export default function YieldPage() {
  const [selected, setSelected] = useState<TemplateKey>("walking");
  const [amount, setAmount] = useState(50);
  const [withdrawAmount, setWithdrawAmount] = useState(10);

  const { walletAddress } = useOxarProgram();
  const vault = usePersonalVault(selected);
  const actions = useVaultActions(selected);
  const usdc = useUsdcBalance();
  const faucet = useFaucet();

  const template = TEMPLATES.find((t) => t.key === selected)!;
  const midApy = (template.apyLow + template.apyHigh) / 2;

  // On-chain values (lamports → USDC)
  const sharesUsdc = vault.totalShares.toNumber() / 1_000_000;
  const myValueUsdc = useMemo(() => {
    if (vault.totalShares.isZero()) return 0;
    const value = vault.totalShares
      .mul(vault.navPerShare)
      .div(new BN(1_000_000));
    return value.toNumber() / 1_000_000;
  }, [vault.totalShares, vault.navPerShare]);

  const handleCreate = async () => {
    const sig = await actions.createVault();
    if (sig) {
      setTimeout(() => vault.refetch(), 1000);
    }
  };

  const handleDeposit = async () => {
    if (amount <= 0) return;
    if (amount > usdc.balance) {
      alert(`Not enough USDC. You have $${usdc.balance.toFixed(2)}`);
      return;
    }
    const sig = await actions.deposit(amount);
    if (sig) {
      setTimeout(() => {
        vault.refetch();
        usdc.refetch();
      }, 1000);
    }
  };

  const handleWithdraw = async () => {
    if (withdrawAmount <= 0) return;
    const shares = new BN(Math.floor(withdrawAmount * 1_000_000));
    if (shares.gt(vault.totalShares)) {
      alert("Not enough shares to withdraw");
      return;
    }
    const sig = await actions.withdraw(shares);
    if (sig) {
      setTimeout(() => {
        vault.refetch();
        usdc.refetch();
      }, 1000);
    }
  };

  const yearly = Math.round(amount * (midApy / 100));

  return (
    <div className="max-w-[1100px] mx-auto pt-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>Wake up your money</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl md:text-4xl text-white leading-tight">
          How loud do you want it?
        </h1>
        <p className="mt-3 font-mono text-sm text-white/40 max-w-md">
          Pick a speed. Your USDC routes into curated sources. Switch anytime —
          no penalty.
        </p>
      </motion.div>

      {/* USDC balance + faucet (devnet) */}
      {walletAddress && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="mt-8 flex flex-wrap items-center gap-4 p-4 rounded-[5px] border border-white/10"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              Your USDC (devnet)
            </p>
            <p className="mt-1 font-mono text-lg text-white tabular-nums">
              ${usdc.balance.toFixed(2)}
            </p>
          </div>
          <div className="flex-1" />
          <button
            onClick={async () => {
              const ok = await faucet.mintUsdc();
              if (ok) setTimeout(() => usdc.refetch(), 1500);
            }}
            disabled={faucet.usdcLoading}
            className="px-3 py-2 rounded border border-white/15 font-mono text-[11px] uppercase tracking-wide text-white/70 hover:border-white/30 hover:text-white disabled:opacity-50 transition"
          >
            {faucet.usdcLoading ? "Minting…" : "Get 10k test USDC"}
          </button>
          <button
            onClick={async () => {
              await faucet.airdropSol();
            }}
            disabled={faucet.solLoading}
            className="px-3 py-2 rounded border border-white/15 font-mono text-[11px] uppercase tracking-wide text-white/70 hover:border-white/30 hover:text-white disabled:opacity-50 transition"
          >
            {faucet.solLoading ? "Sending…" : "Get 1 SOL"}
          </button>
        </motion.section>
      )}

      {/* Risk templates */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-3"
      >
        {TEMPLATES.map((t) => {
          const isSelected = selected === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSelected(t.key)}
              className={`relative text-left p-6 rounded-[8px] border transition-all overflow-hidden ${
                isSelected
                  ? "border-accent/40 bg-accent/[0.04] shadow-[0_0_30px_rgba(139,92,246,0.08)]"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl leading-none">{t.emoji}</span>
                {isSelected && (
                  <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                    Selected
                  </span>
                )}
              </div>
              <h3 className="font-sans text-lg text-white">{t.label}</h3>
              <p className="mt-1 font-mono text-xs text-white/40 leading-relaxed">
                {t.description}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-light text-white">
                  {t.apyLow}–{t.apyHigh}%
                </span>
                <span className="font-mono text-xs text-white/30">APY</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {t.sources.map((src) => (
                  <span
                    key={src}
                    className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border border-white/10 text-white/50"
                  >
                    {src}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </motion.section>

      {/* Vault status / actions */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-12 border border-white/10 rounded-[8px] p-8"
      >
        {!walletAddress ? (
          <p className="font-mono text-sm text-white/40 text-center">
            Sign in to deposit and earn.
          </p>
        ) : vault.loading ? (
          <div className="flex items-center justify-center gap-2 text-white/40">
            <Loader2 className="animate-spin" size={16} />
            <span className="font-mono text-sm">Loading vault…</span>
          </div>
        ) : !vault.exists ? (
          <div className="text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
              No {template.label.toLowerCase()} vault yet
            </p>
            <p className="font-sans text-xl text-white mb-2">
              Wake up your {template.label.toLowerCase()} money
            </p>
            <p className="font-mono text-sm text-white/40 max-w-sm mx-auto mb-6">
              One-time setup — creates your on-chain vault for the{" "}
              {template.label} risk profile (~0.01 SOL rent).
            </p>
            <button
              onClick={handleCreate}
              disabled={actions.loading}
              className="px-8 py-3 rounded-[5px] bg-white text-black font-mono text-sm uppercase tracking-wide hover:bg-white/90 disabled:opacity-50 transition inline-flex items-center gap-2"
            >
              {actions.loading ? (
                <>
                  <Loader2 className="animate-spin" size={14} />
                  Creating vault…
                </>
              ) : (
                <>
                  {template.emoji} Wake {template.label}
                </>
              )}
            </button>
            {actions.error && (
              <p className="mt-4 font-mono text-xs text-red-400">
                {actions.error}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Position */}
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-2">
                Your {template.label.toLowerCase()} position
              </p>
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-mono font-light text-white tabular-nums">
                  ${myValueUsdc.toFixed(2)}
                </span>
                <span className="font-mono text-xs text-white/40">
                  {sharesUsdc.toFixed(4)} shares · NAV{" "}
                  {(vault.navPerShare.toNumber() / 1_000_000).toFixed(6)}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs text-white/30">
                Hot pool: ${(vault.hotPoolBalance.toNumber() / 1_000_000).toFixed(2)} ·
                ~{midApy}% APY · {vault.feeBps / 100}% fee
              </p>
            </div>

            {/* Deposit */}
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
                Add to {template.label.toLowerCase()}
              </p>
              <div className="flex items-baseline justify-between mb-3">
                <span className="font-mono text-sm text-white/50">
                  Deposit
                </span>
                <span className="font-mono text-2xl text-white tabular-nums">
                  ${amount}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(100, Math.floor(usdc.balance))}
                step={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between mt-1 mb-4">
                <span className="font-mono text-[10px] text-white/20">$1</span>
                <span className="font-mono text-[10px] text-white/20">
                  ${Math.max(100, Math.floor(usdc.balance))} (your USDC)
                </span>
              </div>
              <button
                onClick={handleDeposit}
                disabled={actions.loading || amount <= 0 || amount > usdc.balance}
                className="w-full px-6 py-3 rounded-[5px] bg-white text-black font-mono text-sm uppercase tracking-wide hover:bg-white/90 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
              >
                {actions.loading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Depositing…
                  </>
                ) : (
                  <>Deposit ${amount} · earn ~${(amount * (midApy / 100) / 12).toFixed(2)}/mo</>
                )}
              </button>
            </div>

            {/* Withdraw */}
            {!vault.totalShares.isZero() && (
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
                  Wake some up
                </p>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-mono text-sm text-white/50">
                    Withdraw
                  </span>
                  <span className="font-mono text-2xl text-white tabular-nums">
                    ${withdrawAmount}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={Math.max(1, Math.floor(myValueUsdc))}
                  step={1}
                  value={Math.min(withdrawAmount, Math.max(1, Math.floor(myValueUsdc)))}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
                />
                <div className="flex justify-between mt-1 mb-4">
                  <span className="font-mono text-[10px] text-white/20">$1</span>
                  <span className="font-mono text-[10px] text-white/20">
                    ${myValueUsdc.toFixed(2)} (full position)
                  </span>
                </div>
                <button
                  onClick={handleWithdraw}
                  disabled={actions.loading || withdrawAmount <= 0}
                  className="w-full px-6 py-3 rounded-[5px] border border-white/15 hover:border-white/30 text-white font-mono text-sm uppercase tracking-wide disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
                >
                  {actions.loading ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Withdrawing…
                    </>
                  ) : (
                    <>Wake up ${withdrawAmount}</>
                  )}
                </button>
              </div>
            )}

            {actions.error && (
              <p className="font-mono text-xs text-red-400 text-center">
                {actions.error}
              </p>
            )}

            <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest text-center">
              Yield source: Idle (Phase D wires Kamino · JLP · Maple · Ondo)
            </p>
          </div>
        )}

        {/* Quick math (visible when no position) */}
        {vault.exists && vault.totalShares.isZero() && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="p-4 rounded bg-white/[0.03] border border-white/10 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                Yearly est
              </p>
              <p className="font-mono text-xl text-accent">+${yearly}</p>
            </div>
            <div className="p-4 rounded bg-white/[0.03] border border-white/10 text-center">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
                Daily est
              </p>
              <p className="font-mono text-xl text-white">
                +${(yearly / 365).toFixed(2)}
              </p>
            </div>
          </div>
        )}
      </motion.section>
    </div>
  );
}
