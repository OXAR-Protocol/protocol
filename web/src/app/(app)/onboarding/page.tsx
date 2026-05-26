"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { Wallet, Smartphone, ArrowRight } from "lucide-react";

import { SectionLabel } from "@/components/section-label";

export default function OnboardingPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.replace("/home");
  }, [ready, authenticated, router]);

  return (
    <div className="max-w-[1000px] mx-auto pt-8 pb-32 px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>How do you want to start?</SectionLabel>
        <h1 className="mt-4 font-sans text-3xl md:text-4xl text-white leading-tight max-w-2xl">
          Two ways in. Same yield underneath.
        </h1>
        <p className="mt-3 font-mono text-sm text-white/40 max-w-md">
          Pick whichever fits. You can always add the other later.
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Wallet */}
        <button
          onClick={login}
          disabled={!ready}
          className="text-left p-8 rounded-[8px] border border-white/10 hover:border-white/30 transition-all relative overflow-hidden disabled:opacity-50"
        >
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full blur-[120px] opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(114,162,240,0.4), transparent)",
            }}
          />
          <div className="relative">
            <Wallet className="text-white/60 mb-6" size={32} strokeWidth={1.5} />
            <h2 className="font-sans text-2xl text-white">I have crypto</h2>
            <p className="mt-2 font-mono text-sm text-white/40 leading-relaxed">
              Phantom, MetaMask, Backpack, or sign in with email — Privy gives
              you a Solana wallet either way.
            </p>
            <div className="mt-6 inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-white">
              Connect
              <ArrowRight size={14} strokeWidth={1.5} />
            </div>
          </div>
        </button>

        {/* Apple Pay / Google Pay (coming soon — Ramp wire-up) */}
        <div className="text-left p-8 rounded-[8px] border border-white/10 relative overflow-hidden opacity-80">
          <div
            aria-hidden
            className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full blur-[120px] opacity-30"
            style={{
              background:
                "radial-gradient(circle, rgba(139,92,246,0.4), transparent)",
            }}
          />
          <div className="relative">
            <Smartphone
              className="text-white/60 mb-6"
              size={32}
              strokeWidth={1.5}
            />
            <h2 className="font-sans text-2xl text-white">
              Just have a phone
            </h2>
            <p className="mt-2 font-mono text-sm text-white/40 leading-relaxed">
              Apple Pay or Google Pay. We use Ramp Network to convert to USDC —
              lands directly in your non-custodial wallet.
            </p>
            <div className="mt-6 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 font-mono text-[10px] uppercase tracking-widest text-white/40">
              Coming with MVP
            </div>
          </div>
        </div>
      </motion.section>

      {/* Trust bar */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 font-mono text-[10px] uppercase tracking-widest text-white/30"
      >
        <span>Non-custodial</span>
        <span className="opacity-50">·</span>
        <span>Your keys, your money</span>
        <span className="opacity-50">·</span>
        <span>Instant withdraw</span>
        <span className="opacity-50">·</span>
        <span>No bank required</span>
      </motion.section>
    </div>
  );
}
