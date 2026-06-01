"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";

export default function LoginPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.replace("/home");
  }, [ready, authenticated, router]);

  return (
    <div className="fixed inset-0 z-50 bg-surface-0 flex items-center justify-center px-6 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          opacity: 0.12,
          maskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 50% 50%, black, transparent)",
        }}
      >
        <source src="/hero-bg.mp4" type="video/mp4" />
      </video>

      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom,
            #000000 0%,
            rgba(10,10,15,0.6) 30%,
            rgba(10,10,15,0.5) 50%,
            rgba(10,10,15,0.6) 70%,
            #000000 100%
          )`,
        }}
      />

      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(114,162,240,0.1), rgba(139,92,246,0.05), transparent)",
        }}
      />

      <div className="relative z-20 flex flex-col items-center text-center max-w-md mx-auto">
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="font-mono text-xs font-semibold tracking-[0.15em] uppercase text-white/30"
        >
          [ Welcome ]
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-6 text-[clamp(2.5rem,6vw,3.5rem)] font-sans font-normal leading-tight text-white"
        >
          Where does your
          <br />
          money sleep?
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-6 font-mono text-sm text-white/50 leading-relaxed max-w-sm"
        >
          Wake it up. Earn yield. Save together.{" "}
          <span className="text-white">No bank. No broker. No lock.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-10 flex flex-col items-center gap-3"
        >
          <button
            // v2: the account must be a Solana wallet (email → embedded, or a
            // Solana wallet you log in with). Restrict the login modal to Solana
            // wallets so an EVM wallet can't become an account — EVM wallets are
            // linked later only to PAY (deposit panel). See
            // docs/plans/2026-06-01-wallet-payment-architecture-v2.md.
            onClick={() => login({ walletChainType: "solana-only" })}
            disabled={!ready || authenticated}
            className="inline-flex items-center gap-2 px-8 py-3 rounded font-mono text-sm uppercase tracking-wide transition-all duration-200 bg-white text-surface-0 hover:bg-white/90 disabled:bg-white/[0.06] disabled:text-white/30 disabled:cursor-not-allowed"
          >
            {authenticated ? "Redirecting" : "Wake up your money"}
          </button>

          <span className="font-mono text-[10px] text-white/25 uppercase tracking-wide">
            Email · Phantom · Solflare · Backpack
          </span>
        </motion.div>

      </div>

      <motion.a
        href="/"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        className="absolute top-6 left-6 z-30 font-mono text-xs text-white/30 hover:text-white transition-colors"
      >
        ← Back to home
      </motion.a>
    </div>
  );
}
