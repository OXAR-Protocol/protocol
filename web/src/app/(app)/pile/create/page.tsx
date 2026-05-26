"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

import { SectionLabel } from "@/components/section-label";
import { useUsdcBalance } from "@/hooks/use-usdc-balance";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { useFaucet } from "@/hooks/use-faucet";
import {
  useGroupVaultActions,
  generateInviteCode,
  encodeInviteCode,
} from "@/hooks/use-group-vault-actions";

const RISK_OPTIONS = [
  {
    key: "conservative" as const,
    emoji: "😴",
    label: "Sleepy",
    description: "Slow but steady",
  },
  {
    key: "balanced" as const,
    emoji: "🚶",
    label: "Walking",
    description: "Balanced pace",
  },
  {
    key: "aggressive" as const,
    emoji: "🏃",
    label: "Running",
    description: "Fast and loud",
  },
];

export default function CreatePilePage() {
  const router = useRouter();
  const { walletAddress } = useOxarProgram();
  const usdc = useUsdcBalance();
  const faucet = useFaucet();
  const actions = useGroupVaultActions();

  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [risk, setRisk] = useState<"conservative" | "balanced" | "aggressive">(
    "balanced",
  );
  const [initialDeposit, setInitialDeposit] = useState(10);
  const [displayName, setDisplayName] = useState("");
  const [createdInvite, setCreatedInvite] = useState<{
    pda: string;
    inviteUrl: string;
  } | null>(null);

  const canCreate =
    !!walletAddress &&
    name.trim().length > 0 &&
    name.length <= 48 &&
    Number(goal) > 0 &&
    initialDeposit >= 1 &&
    initialDeposit <= usdc.balance;

  const handleCreate = async () => {
    if (!canCreate) return;
    const inviteCode = generateInviteCode();
    const deadlineTs = deadline ? Math.floor(new Date(deadline).getTime() / 1000) : 0;
    const result = await actions.createGroup({
      name: name.trim(),
      goalAmount: Number(goal),
      goalDeadline: deadlineTs,
      inviteCode,
      riskTemplate: risk,
      initialDeposit,
      displayName: displayName.trim() || "Creator",
    });
    if (result) {
      const encoded = encodeInviteCode(inviteCode);
      const inviteUrl = `${window.location.origin}/pile/join?g=${result.groupVaultPda.toBase58()}&c=${encoded}`;
      setCreatedInvite({ pda: result.groupVaultPda.toBase58(), inviteUrl });
    }
  };

  // Success state
  if (createdInvite) {
    return (
      <div className="max-w-[700px] mx-auto pt-8 pb-32 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <Sparkles className="mx-auto text-accent mb-4" size={32} strokeWidth={1.5} />
          <SectionLabel>Your pile is live</SectionLabel>
          <h1 className="mt-4 font-sans text-3xl text-white">
            Share the invite
          </h1>
          <p className="mt-3 font-mono text-sm text-white/40 max-w-md mx-auto">
            Send this link to people you trust. Each one can deposit USDC and
            hold their own share.
          </p>

          <div className="mt-8 p-4 rounded-[8px] border border-white/15 bg-white/[0.03]">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 mb-2">
              Invite link
            </p>
            <p className="font-mono text-xs text-white/70 break-all">
              {createdInvite.inviteUrl}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdInvite.inviteUrl);
              }}
              className="px-5 py-3 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 transition"
            >
              Copy link
            </button>
            <button
              onClick={() => router.push(`/pile/${createdInvite.pda}`)}
              className="px-5 py-3 rounded-[5px] border border-white/15 text-white font-mono text-xs uppercase tracking-wide hover:border-white/30 transition"
            >
              Open pile →
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[700px] mx-auto pt-8 pb-32 px-4">
      <Link
        href="/pile"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-white/40 hover:text-white mb-8"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        Back to piles
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>Start a pile</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl text-white">
          What are you saving for?
        </h1>
        <p className="mt-3 font-mono text-sm text-white/40 max-w-md">
          Set a real goal. Invite people you trust. Watch it grow with yield.
        </p>
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

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-8 space-y-6"
      >
        {/* Name */}
        <Field label="What's the pile for?">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 48))}
            placeholder="Lisbon apartment / Wedding / Bali trip"
            className="w-full bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-sans text-lg text-white py-2 placeholder:text-white/20"
          />
          <span className="font-mono text-[10px] text-white/30 mt-1 block">
            {name.length}/48
          </span>
        </Field>

        {/* Goal */}
        <Field label="Goal amount (USDC)">
          <input
            type="number"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="5000"
            min={1}
            className="w-full bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-lg text-white py-2 placeholder:text-white/20"
          />
        </Field>

        {/* Deadline (optional) */}
        <Field label="By when? (optional)">
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-mono text-base text-white py-2"
          />
        </Field>

        {/* Risk */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
            How loud should the pile be?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {RISK_OPTIONS.map((opt) => {
              const active = risk === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setRisk(opt.key)}
                  className={`p-4 rounded-[5px] border transition text-center ${
                    active
                      ? "border-accent/40 bg-accent/[0.04]"
                      : "border-white/10 hover:border-white/25"
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="font-mono text-xs uppercase tracking-wide text-white">
                    {opt.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Your display name */}
        <Field label="Your name in the pile">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 32))}
            placeholder="Daniel"
            className="w-full bg-transparent border-b border-white/15 focus:border-white/40 outline-none font-sans text-base text-white py-2 placeholder:text-white/20"
          />
        </Field>

        {/* Initial deposit */}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-3">
            Your first deposit
          </p>
          <div className="flex items-baseline justify-between mb-2">
            <span className="font-mono text-sm text-white/50">
              Deposit (min $1)
            </span>
            <span className="font-mono text-2xl text-white tabular-nums">
              ${initialDeposit}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={Math.max(100, Math.floor(usdc.balance))}
            step={1}
            value={initialDeposit}
            onChange={(e) => setInitialDeposit(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent"
          />
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[10px] text-white/20">$1</span>
            <span className="font-mono text-[10px] text-white/20">
              ${Math.max(100, Math.floor(usdc.balance))} (max)
            </span>
          </div>
        </div>

        {/* Create button */}
        <div className="pt-4">
          <button
            onClick={handleCreate}
            disabled={!canCreate || actions.loading}
            className="w-full px-6 py-4 rounded-[5px] bg-white text-black font-mono text-sm uppercase tracking-wide hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition inline-flex items-center justify-center gap-2"
          >
            {actions.loading ? (
              <>
                <Loader2 className="animate-spin" size={14} />
                Creating pile…
              </>
            ) : (
              <>Start the pile with ${initialDeposit}</>
            )}
          </button>

          {actions.error && (
            <p className="mt-3 font-mono text-xs text-red-400 text-center">
              {actions.error}
            </p>
          )}

          <p className="mt-4 text-center font-mono text-[10px] text-white/30 uppercase tracking-widest">
            One-time on-chain setup · ~0.02 SOL rent
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-1">
        {label}
      </p>
      {children}
    </div>
  );
}
