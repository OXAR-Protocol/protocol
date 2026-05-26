"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { ArrowLeft, Copy, Check, Loader2, LogOut, Users } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { useGroupVault } from "@/hooks/use-group-vault";
import { useGroupMembers } from "@/hooks/use-group-members";
import { useGroupVaultActions } from "@/hooks/use-group-vault-actions";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";

export default function PileDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { walletAddress } = useOxarProgram();

  const groupVaultPda = useMemo(() => {
    try {
      return new PublicKey(params.id);
    } catch {
      return null;
    }
  }, [params.id]);

  const { group, backing, member, loading, refetch } =
    useGroupVault(groupVaultPda);
  const { members, refetch: refetchMembers } = useGroupMembers(groupVaultPda);
  const actions = useGroupVaultActions();
  const usdc = useUsdcBalance();

  const [depositAmount, setDepositAmount] = useState(10);
  const [withdrawAmount, setWithdrawAmount] = useState(5);
  const [copied, setCopied] = useState(false);

  // Computed
  const totalUsdc = backing
    ? backing.totalShares
        .mul(backing.navPerShare)
        .div(new BN(1_000_000))
        .toNumber() / 1_000_000
    : 0;
  const goalUsdc = group ? group.goalAmount.toNumber() / 1_000_000 : 0;
  const progressPct = goalUsdc > 0 ? Math.min(100, (totalUsdc / goalUsdc) * 100) : 0;
  const memberValueUsdc = member && backing
    ? member.sharesOwned.mul(backing.navPerShare).div(new BN(1_000_000)).toNumber() /
      1_000_000
    : 0;

  const isMember = !!member;
  const canLeave = isMember && member!.sharesOwned.isZero();
  const deadlineLabel = group?.goalDeadline.isZero()
    ? "No deadline"
    : group
      ? new Date(group.goalDeadline.toNumber() * 1000).toLocaleDateString()
      : "—";

  const inviteUrl =
    typeof window !== "undefined" && groupVaultPda
      ? `${window.location.origin}/pile/join?g=${groupVaultPda.toBase58()}&c=`
      : "";

  const handleDeposit = async () => {
    if (!groupVaultPda || !group || !backing) return;
    if (depositAmount > usdc.balance) {
      alert(`Not enough USDC. You have $${usdc.balance.toFixed(2)}`);
      return;
    }
    const sig = await actions.depositToGroup(
      groupVaultPda,
      group.vault,
      depositAmount,
    );
    if (sig) {
      setTimeout(() => {
        refetch();
        usdc.refetch();
      }, 1000);
    }
  };

  const handleWithdraw = async () => {
    if (!groupVaultPda || !group || !member) return;
    const shares = new BN(Math.floor(withdrawAmount * 1_000_000));
    if (shares.gt(member.sharesOwned)) {
      alert("Not enough shares");
      return;
    }
    const sig = await actions.withdrawFromGroup(
      groupVaultPda,
      group.vault,
      shares,
    );
    if (sig) {
      setTimeout(() => {
        refetch();
        usdc.refetch();
      }, 1000);
    }
  };

  const handleLeave = async () => {
    if (!groupVaultPda) return;
    if (!confirm("Close your spot in this pile? Rent will refund.")) return;
    const sig = await actions.leaveGroup(groupVaultPda);
    if (sig) {
      setTimeout(() => {
        refetchMembers();
        router.push("/pile");
      }, 1500);
    }
  };

  if (!groupVaultPda) {
    return <ErrorState message="Invalid pile ID" />;
  }

  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto pt-20 flex justify-center text-white/40">
        <Loader2 className="animate-spin" size={20} />
      </div>
    );
  }

  if (!group) {
    return <ErrorState message="Pile not found. Has it been created on-chain?" />;
  }

  return (
    <div className="max-w-[1100px] mx-auto pt-8 pb-32 px-4">
      <Link
        href="/pile"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-white/40 hover:text-white mb-8"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        All piles
      </Link>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>{deadlineLabel}</SectionLabel>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-sans text-3xl md:text-4xl text-white leading-tight">
            {group.name}
          </h1>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 font-mono text-[11px] uppercase tracking-widest text-white/40">
            <Users size={11} strokeWidth={1.5} />
            {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
          </div>
        </div>
      </motion.div>

      {/* Progress */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-8"
      >
        <div className="flex items-baseline justify-between mb-2">
          <span className="font-mono text-2xl text-white tabular-nums">
            ${totalUsdc.toFixed(2)}
          </span>
          <span className="font-mono text-sm text-white/40">
            of ${goalUsdc.toLocaleString()}
          </span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${progressPct}%`,
              background:
                "linear-gradient(90deg, rgba(139,92,246,0.8), rgba(114,162,240,0.8))",
              boxShadow: "0 0 20px rgba(139,92,246,0.3)",
            }}
          />
        </div>
        <p className="mt-2 font-mono text-xs text-white/40">
          {progressPct.toFixed(1)}% to goal
          {progressPct >= 100 && " · 🎉 goal reached"}
        </p>
      </motion.section>

      {/* Your position */}
      {isMember && member && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8 p-6 rounded-[8px] border border-accent/30 bg-accent/[0.04]"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-2">
            Your position
          </p>
          <p className="font-mono text-3xl text-white tabular-nums">
            ${memberValueUsdc.toFixed(2)}
          </p>
          <p className="mt-1 font-mono text-xs text-white/50">
            {(member.sharesOwned.toNumber() / 1_000_000).toFixed(4)} shares · joined as{" "}
            <span className="text-white">{member.displayName}</span>
          </p>
        </motion.section>
      )}

      {/* Actions */}
      {isMember && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Deposit */}
          <div className="p-6 rounded-[8px] border border-white/10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
              Add to pile
            </p>
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-mono text-sm text-white/50">Deposit</span>
              <span className="font-mono text-2xl text-white tabular-nums">
                ${depositAmount}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={Math.max(100, Math.floor(usdc.balance))}
              step={1}
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
            />
            <div className="flex justify-between mt-1 mb-4 font-mono text-[10px] text-white/20">
              <span>$1</span>
              <span>${Math.max(100, Math.floor(usdc.balance))}</span>
            </div>
            <button
              onClick={handleDeposit}
              disabled={actions.loading || depositAmount > usdc.balance}
              className="w-full px-5 py-3 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
            >
              {actions.loading ? (
                <>
                  <Loader2 className="animate-spin" size={12} />
                  Depositing…
                </>
              ) : (
                <>Add ${depositAmount}</>
              )}
            </button>
            <p className="mt-2 font-mono text-[10px] text-white/30 text-center">
              You have ${usdc.balance.toFixed(2)} USDC
            </p>
          </div>

          {/* Withdraw */}
          {member && !member.sharesOwned.isZero() && (
            <div className="p-6 rounded-[8px] border border-white/10">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
                Wake your share
              </p>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-mono text-sm text-white/50">Withdraw</span>
                <span className="font-mono text-2xl text-white tabular-nums">
                  ${withdrawAmount}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={Math.max(1, Math.floor(memberValueUsdc))}
                step={1}
                value={Math.min(withdrawAmount, Math.max(1, Math.floor(memberValueUsdc)))}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
              />
              <div className="flex justify-between mt-1 mb-4 font-mono text-[10px] text-white/20">
                <span>$1</span>
                <span>${memberValueUsdc.toFixed(2)} (full)</span>
              </div>
              <button
                onClick={handleWithdraw}
                disabled={actions.loading}
                className="w-full px-5 py-3 rounded-[5px] border border-white/15 text-white font-mono text-xs uppercase tracking-wide hover:border-white/30 disabled:opacity-30 transition inline-flex items-center justify-center gap-2"
              >
                {actions.loading ? (
                  <>
                    <Loader2 className="animate-spin" size={12} />
                    Withdrawing…
                  </>
                ) : (
                  <>Wake up ${withdrawAmount}</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {actions.error && (
        <p className="mt-4 font-mono text-xs text-red-400 text-center">
          {actions.error}
        </p>
      )}

      {/* Not a member CTA */}
      {!isMember && walletAddress && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-8 p-6 rounded-[8px] border border-dashed border-white/15 text-center"
        >
          <p className="font-mono text-sm text-white/50 mb-3">
            You're not in this pile yet.
          </p>
          <p className="font-mono text-xs text-white/30">
            Need an invite link to join — ask the creator.
          </p>
        </motion.section>
      )}

      {/* Members */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-12"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Contributors
        </p>
        <div className="space-y-2">
          {members.length === 0 ? (
            <p className="font-mono text-sm text-white/30">No members yet.</p>
          ) : (
            members.map((m) => {
              const value =
                backing &&
                m.sharesOwned
                  .mul(backing.navPerShare)
                  .div(new BN(1_000_000))
                  .toNumber() / 1_000_000;
              const isYou =
                walletAddress && m.member.equals(walletAddress);
              return (
                <div
                  key={m.member.toBase58()}
                  className="flex items-center justify-between p-4 rounded-[5px] border border-white/10"
                >
                  <div>
                    <p className="font-sans text-sm text-white">
                      {m.displayName}{" "}
                      {isYou && (
                        <span className="font-mono text-[10px] text-accent uppercase tracking-widest ml-1">
                          you
                        </span>
                      )}
                    </p>
                    <p className="font-mono text-xs text-white/30">
                      {m.member.toBase58().slice(0, 6)}…
                      {m.member.toBase58().slice(-6)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-white tabular-nums">
                      ${value ? value.toFixed(2) : "0.00"}
                    </p>
                    <p className="font-mono text-[10px] text-white/30">
                      deposited{" "}
                      ${(m.depositedAmount.toNumber() / 1_000_000).toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.section>

      {/* Invite (creator only) */}
      {walletAddress && group.creator.equals(walletAddress) && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-8 p-6 rounded-[8px] border border-white/10"
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-2">
            Invite link
          </p>
          <p className="font-mono text-xs text-white/50 leading-relaxed">
            You created this pile. The full invite link (with code) is shown
            once at creation time — keep it safe to add new members. If lost,
            you can't recover it (it's hashed on-chain).
          </p>
          <p className="mt-3 font-mono text-xs text-white/40 break-all">
            {inviteUrl}
            <span className="text-white/20">[invite-code]</span>
          </p>
        </motion.section>
      )}

      {/* Leave (only when balance = 0) */}
      {canLeave && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 text-center"
        >
          <button
            onClick={handleLeave}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[5px] border border-white/15 hover:border-red-500/40 hover:text-red-400 font-mono text-xs uppercase tracking-wide text-white/60 transition"
          >
            <LogOut size={12} strokeWidth={1.5} />
            Leave pile (refunds rent)
          </button>
        </motion.section>
      )}
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
