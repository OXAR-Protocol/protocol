"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Users, Loader2 } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

import { SectionLabel } from "@/components/section-label";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import {
  useUserGroupVaults,
  type GroupVaultData,
} from "@/hooks/use-group-vault";

export default function PilePage() {
  const { walletAddress } = useOxarProgram();
  const { created, joined, loading } = useUserGroupVaults();

  const hasAny = created.length > 0 || joined.length > 0;

  return (
    <div className="max-w-[1100px] mx-auto pt-8 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <SectionLabel>Friends piles</SectionLabel>
            <h1 className="mt-4 font-sans text-3xl md:text-4xl text-white leading-tight">
              Save together on something real.
            </h1>
            <p className="mt-3 font-mono text-sm text-white/40 max-w-lg">
              Shared on-chain vault for a real goal. Each member holds their
              own share. Anyone can exit anytime.
            </p>
          </div>
          <Link
            href="/pile/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 transition"
          >
            <Plus size={14} strokeWidth={1.5} />
            Start a pile
          </Link>
        </div>
      </motion.div>

      {!walletAddress ? (
        <p className="mt-10 font-mono text-sm text-white/40 text-center">
          Sign in to see your piles.
        </p>
      ) : loading ? (
        <div className="mt-10 flex items-center justify-center gap-2 text-white/40">
          <Loader2 className="animate-spin" size={16} />
          <span className="font-mono text-sm">Loading piles…</span>
        </div>
      ) : !hasAny ? (
        <EmptyState />
      ) : (
        <div className="mt-10 space-y-12">
          {created.length > 0 && (
            <section>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
                You created
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {created.map((g) => (
                  <PileCard key={g.pda.toBase58()} group={g} />
                ))}
              </div>
            </section>
          )}
          {joined.length > 0 && (
            <section>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
                You joined
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {joined.map((g) => (
                  <PileCard key={g.pda.toBase58()} group={g} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function PileCard({ group }: { group: GroupVaultData }) {
  const goalUsdc = group.goalAmount.toNumber() / 1_000_000;

  const deadlineLabel = group.goalDeadline.isZero()
    ? "No deadline"
    : new Date(group.goalDeadline.toNumber() * 1000).toLocaleDateString();

  return (
    <Link
      href={`/pile/${group.pda.toBase58()}`}
      className="block p-6 rounded-[8px] border border-white/10 hover:border-white/30 transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-sans text-xl text-white">{group.name}</h3>
          <p className="mt-1 font-mono text-xs text-white/40">
            ${goalUsdc.toLocaleString()} goal · {deadlineLabel}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.04] border border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
          <Users size={10} strokeWidth={1.5} />
          {group.memberCount}
        </div>
      </div>
      <p className="font-mono text-xs text-white/30">
        Tap to open →
      </p>
    </Link>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mt-10"
    >
      <div className="relative overflow-hidden rounded-[8px] border border-white/10 p-10 text-center">
        <div
          aria-hidden
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full blur-[120px] opacity-25 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(139,92,246,0.4), rgba(114,162,240,0.2), transparent)",
          }}
        />
        <div className="relative">
          <Users
            className="mx-auto mb-4 text-white/30"
            size={32}
            strokeWidth={1.5}
          />
          <h2 className="font-sans text-xl text-white">No piles yet</h2>
          <p className="mt-2 font-mono text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
            Start your first pile — pick a goal, invite people you trust,
            watch USDC accumulate.
          </p>
          <Link
            href="/pile/create"
            className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 transition"
          >
            <Plus size={14} strokeWidth={1.5} />
            Start a pile
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
