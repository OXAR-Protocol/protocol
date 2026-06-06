"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowUpRight, Sparkles, Loader2 } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { LiveAmount } from "@/components/live-amount";
import { LiveEarned } from "@/components/live-earned";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useEarnings } from "@/hooks/use-earnings";
import { fromBaseUnits } from "@/lib/yield";

export default function HomePage() {
  const { user } = usePrivy();
  const { totalUsdc, blendedApy, positionCount, views, loading } =
    useAggregatePersonalBalance();
  // Real earnings already made (current value − on-chain cost basis), not a projection.
  const earnings = useEarnings();
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

  const activePositions = views.filter(
    (v) => Number(v.underlyingBalance) > 0,
  );

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
          {loading ? (
            <span className="text-[clamp(2rem,5vw,3rem)] font-sans font-light text-white/30 leading-none">
              <Loader2 className="animate-spin inline" size={28} />
            </span>
          ) : (
            <LiveAmount value={totalUsdc} apy={blendedApy} variant="hero" />
          )}
          {earnings.supportedValue > 0 && (
            <span
              className="font-mono text-sm text-accent"
              title="Real earnings since you bought in — current value minus what you put in, read on-chain (not a projection)."
            >
              <LiveEarned
                currentValue={earnings.supportedValue}
                invested={earnings.totalInvested}
                apy={earnings.blendedApy}
              />{" "}
              earned
            </span>
          )}
        </div>
        <p className="mt-3 font-mono text-sm text-white/40">
          {totalUsdc > 0
            ? `${positionCount} source${positionCount === 1 ? "" : "s"} · earning every block`
            : "Drop USDC into a source to start earning"}
        </p>
      </motion.section>

      {/* Empty state — first-time hero */}
      {totalUsdc === 0 && !loading && (
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
                Pick a source. Deposit USDC. Earn yield from day one. Withdraw
                whenever you want — you always hold your own position.
              </p>
              <div className="mt-6">
                <Link
                  href="/yield"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 transition"
                >
                  Wake up your money
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Where it's sleeping — live positions */}
      {activePositions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-12"
        >
          <div className="flex items-baseline justify-between mb-4">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-white/30">
              Where it's sleeping
            </p>
            <Link
              href="/pile"
              className="font-mono text-xs text-white/40 hover:text-white transition-colors"
            >
              Manage →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activePositions.map((v) => {
              const value = fromBaseUnits(v.underlyingBalance, v.decimals);
              return (
                <Link
                  key={v.id}
                  href="/pile"
                  className="p-5 rounded-[8px] border border-white/10 hover:border-white/30 transition-colors min-h-[120px] flex flex-col justify-between"
                >
                  <div>
                    <p className="font-sans text-base text-white">{v.name}</p>
                    <p className="mt-1 font-mono text-xs text-white/40">
                      {(v.apy * 100).toFixed(2)}% APY · {v.assetSymbol}
                    </p>
                  </div>
                  <LiveAmount value={value} apy={v.apy} variant="md" />
                </Link>
              );
            })}
          </div>
        </motion.section>
      )}

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
