"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowUpRight, Plus, Sparkles, Loader2 } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useUserGroupVaults } from "@/hooks/use-group-vault";

export default function HomePage() {
  const { user, ready, authenticated } = usePrivy();
  const personal = useAggregatePersonalBalance();
  const groups = useUserGroupVaults();
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting("Up late");
    else if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handle = user?.email?.address
    ? user.email.address.split("@")[0]
    : user?.wallet?.address
      ? `${user.wallet.address.slice(0, 4)}…${user.wallet.address.slice(-4)}`
      : "friend";

  // Aggregate balance from personal vaults
  const totalBalance = personal.totalUsdc;
  const dailyYield = 0; // TODO: estimate from APY × balance when adapters land
  const apy = personal.vaultCount > 0 ? 0 : 0; // Currently Idle → 0% real yield
  const userPiles = [...groups.created, ...groups.joined];
  const balanceLoading = personal.loading || groups.loading;

  return (
    <div className="max-w-[1100px] mx-auto pt-8 pb-32">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>{`${greeting}, ${handle}`}</SectionLabel>
      </motion.div>

      {/* Balance hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-6 mb-12"
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">
          Your sleeping money
        </p>
        <div className="mt-3 flex items-baseline gap-4">
          {balanceLoading ? (
            <span className="text-[clamp(2rem,5vw,3rem)] font-sans font-light text-white/30 leading-none">
              <Loader2 className="animate-spin inline" size={28} />
            </span>
          ) : (
            <span className="text-[clamp(2.5rem,6vw,4rem)] font-sans font-light text-white leading-none tabular-nums">
              ${totalBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          )}
          {totalBalance > 0 && dailyYield > 0 && (
            <span className="font-mono text-sm text-accent">
              +${dailyYield.toFixed(2)} today
            </span>
          )}
        </div>
        <p className="mt-3 font-mono text-sm text-white/40">
          {totalBalance > 0
            ? `${personal.vaultCount} vault${personal.vaultCount === 1 ? "" : "s"} · earning every block`
            : "Drop USDC into a vault to start earning"}
        </p>
      </motion.section>

      {/* Empty state — first-time hero */}
      {totalBalance === 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-[8px] border border-white/10 p-8 md:p-10">
            <div
              aria-hidden
              className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full blur-[120px] opacity-30"
              style={{
                background:
                  "radial-gradient(circle, rgba(114,162,240,0.4), rgba(139,92,246,0.2), transparent)",
              }}
            />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-accent/10 border border-accent/30 font-mono text-[10px] uppercase tracking-widest text-accent">
                <Sparkles size={10} strokeWidth={1.5} />
                Start here
              </span>
              <h2 className="mt-4 font-sans text-2xl md:text-3xl text-white leading-tight">
                Your money's been napping.
                <br />
                <span className="text-white/50">Let's wake it up.</span>
              </h2>
              <p className="mt-3 font-mono text-sm text-white/40 max-w-md leading-relaxed">
                Pick a speed (sleepy, walking, or running). Deposit USDC. Earn yield from
                day one. Withdraw whenever you want.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/yield"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 transition"
                >
                  Wake up your money
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </Link>
                <Link
                  href="/pile"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[5px] border border-white/15 text-white/70 font-mono text-xs uppercase tracking-wide hover:text-white hover:border-white/30 transition"
                >
                  <Plus size={14} strokeWidth={1.5} />
                  Start a pile
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Piles row */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mb-12"
      >
        <div className="flex items-baseline justify-between mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">
            Your piles
          </p>
          <Link
            href="/pile"
            className="font-mono text-xs text-white/40 hover:text-white transition-colors"
          >
            See all →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {userPiles.slice(0, 4).map((g) => {
            const goalUsdc = g.goalAmount.toNumber() / 1_000_000;
            return (
              <Link
                key={g.pda.toBase58()}
                href={`/pile/${g.pda.toBase58()}`}
                className="p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition-colors min-h-[120px] flex flex-col justify-between"
              >
                <div>
                  <p className="font-sans text-base text-white">{g.name}</p>
                  <p className="mt-1 font-mono text-xs text-white/40">
                    ${goalUsdc.toLocaleString()} goal · {g.memberCount}{" "}
                    {g.memberCount === 1 ? "member" : "members"}
                  </p>
                </div>
                <p className="font-mono text-[10px] text-white/30 uppercase tracking-widest">
                  Tap →
                </p>
              </Link>
            );
          })}
          <Link
            href="/pile/create"
            className="border border-dashed border-white/15 rounded-[8px] p-6 hover:border-white/30 transition-colors flex flex-col items-start gap-3 min-h-[120px] justify-between"
          >
            <Plus className="text-white/30" size={18} strokeWidth={1.5} />
            <div>
              <p className="font-sans text-base text-white">
                {userPiles.length > 0 ? "Start another pile" : "Start a pile"}
              </p>
              <p className="mt-1 font-mono text-xs text-white/40">
                Save together on something real
              </p>
            </div>
          </Link>
        </div>
      </motion.section>

      {/* Activity placeholder */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30 mb-4">
          Recent activity
        </p>
        <div className="border border-white/10 rounded-[8px] p-6 text-center">
          <p className="font-mono text-sm text-white/40">
            Nothing yet — your money is still snoring.
          </p>
        </div>
      </motion.section>
    </div>
  );
}
