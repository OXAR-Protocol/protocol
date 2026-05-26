"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PublicKey } from "@solana/web3.js";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

import { SectionLabel } from "@/components/section-label";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { useGroupVault } from "@/hooks/use-group-vault";
import {
  useGroupVaultActions,
  decodeInviteCode,
} from "@/hooks/use-group-vault-actions";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useFaucet } from "@/hooks/use-faucet";

function JoinPileBody() {
  const router = useRouter();
  const params = useSearchParams();
  const { walletAddress } = useOxarProgram();
  const usdc = useUsdcBalance();
  const faucet = useFaucet();
  const actions = useGroupVaultActions();

  const groupParam = params.get("g");
  const codeParam = params.get("c");

  const groupVaultPda = useMemo(() => {
    if (!groupParam) return null;
    try {
      return new PublicKey(groupParam);
    } catch {
      return null;
    }
  }, [groupParam]);

  const inviteCode = useMemo(() => {
    if (!codeParam) return null;
    try {
      return decodeInviteCode(codeParam);
    } catch {
      return null;
    }
  }, [codeParam]);

  const { group, backing, member, loading } = useGroupVault(groupVaultPda);

  const [deposit, setDeposit] = useState(10);
  const [displayName, setDisplayName] = useState("");

  // If already a member, redirect to detail
  useEffect(() => {
    if (member && groupVaultPda) {
      router.replace(`/pile/${groupVaultPda.toBase58()}`);
    }
  }, [member, groupVaultPda, router]);

  if (!groupVaultPda || !inviteCode) {
    return <ErrorState message="Invite link is invalid or incomplete." />;
  }

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto pt-20 flex justify-center text-white/40">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (!group) {
    return (
      <ErrorState message="Pile not found on-chain. The link may be outdated." />
    );
  }

  const totalUsdc = backing
    ? backing.totalShares
        .mul(backing.navPerShare)
        .div(new BN(1_000_000))
        .toNumber() / 1_000_000
    : 0;
  const goalUsdc = group.goalAmount.toNumber() / 1_000_000;
  const progressPct = goalUsdc > 0 ? Math.min(100, (totalUsdc / goalUsdc) * 100) : 0;

  const canJoin =
    !!walletAddress &&
    deposit >= 1 &&
    deposit <= usdc.balance &&
    displayName.trim().length > 0;

  const handleJoin = async () => {
    if (!canJoin || !groupVaultPda || !group) return;
    const sig = await actions.joinGroup(
      groupVaultPda,
      group.vault,
      inviteCode,
      deposit,
      displayName.trim(),
    );
    if (sig) {
      setTimeout(() => {
        router.push(`/pile/${groupVaultPda.toBase58()}`);
      }, 1000);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto pt-8 pb-32 px-4">
      <Link
        href="/pile"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-white/40 hover:text-white mb-8"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        All piles
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>You've been invited</SectionLabel>
        <h1 className="mt-3 font-sans text-3xl text-white leading-tight">
          {group.name}
        </h1>
        <p className="mt-2 font-mono text-sm text-white/40">
          ${goalUsdc.toLocaleString()} goal · {group.memberCount}{" "}
          {group.memberCount === 1 ? "member" : "members"}
        </p>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-mono text-sm text-white tabular-nums">
              ${totalUsdc.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-white/40">
              of ${goalUsdc.toLocaleString()}
            </span>
          </div>
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full transition-all"
              style={{
                width: `${progressPct}%`,
                background:
                  "linear-gradient(90deg, rgba(139,92,246,0.8), rgba(114,162,240,0.8))",
              }}
            />
          </div>
        </div>
      </motion.div>

      {/* USDC bar */}
      {walletAddress && (
        <div className="mt-8 flex flex-wrap items-center gap-4 p-4 rounded-[5px] border border-white/10">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              Your USDC
            </p>
            <p className="mt-1 font-mono text-lg text-white tabular-nums">
              ${usdc.balance.toFixed(2)}
            </p>
          </div>
          <div className="flex-1" />
          {usdc.balance < 1 && (
            <button
              onClick={async () => {
                const ok = await faucet.mintUsdc();
                if (ok) setTimeout(() => usdc.refetch(), 1500);
              }}
              disabled={faucet.usdcLoading}
              className="px-3 py-2 rounded border border-white/15 font-mono text-[11px] uppercase tracking-wide text-white/70 hover:border-white/30 disabled:opacity-50 transition"
            >
              {faucet.usdcLoading ? "Minting…" : "Get test USDC"}
            </button>
          )}
        </div>
      )}

      {/* Join form */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 space-y-6"
      >
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-2">
            Your name in the pile
          </p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
            placeholder="Maria"
            className="w-full bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-sans text-base text-white py-2 placeholder:text-white/20"
          />
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
            Your contribution
          </p>
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-mono text-sm text-white/50">First deposit</span>
            <span className="font-mono text-2xl text-white tabular-nums">
              ${deposit}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(100, Math.floor(usdc.balance))}
            step={1}
            value={deposit}
            onChange={(e) => setDeposit(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between mt-1 font-mono text-[10px] text-white/20">
            <span>$1</span>
            <span>${Math.max(100, Math.floor(usdc.balance))}</span>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={!canJoin || actions.loading}
          className="w-full px-6 py-4 rounded-[5px] bg-white text-black font-mono text-sm uppercase tracking-wide hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
        >
          {actions.loading ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              Joining…
            </>
          ) : (
            <>
              <Users size={14} strokeWidth={1.5} />
              Join with ${deposit}
            </>
          )}
        </button>

        {actions.error && (
          <p className="font-mono text-xs text-red-400 text-center">
            {actions.error}
          </p>
        )}

        <p className="font-mono text-[10px] text-white/30 text-center uppercase tracking-widest">
          One-time on-chain — your share stays yours · exit anytime
        </p>
      </motion.div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="max-w-[600px] mx-auto pt-20 text-center">
      <p className="font-mono text-sm text-white/40">{message}</p>
      <Link
        href="/pile"
        className="mt-4 inline-block font-mono text-xs text-accent hover:underline"
      >
        ← Back to piles
      </Link>
    </div>
  );
}

export default function JoinPilePage() {
  return (
    <Suspense fallback={null}>
      <JoinPileBody />
    </Suspense>
  );
}
