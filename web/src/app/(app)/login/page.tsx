"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";

export default function LoginPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  useEffect(() => {
    if (ready && authenticated) router.replace("/home");
  }, [ready, authenticated, router]);

  // The access wall already approved this browser. Here we just authenticate —
  // email or a Solana wallet; the account is whichever you log in with.
  const handleLogin = () => {
    if (!ready || authenticated) return;
    login({ walletChainType: "solana-only" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-white px-6 text-black">
      <Link
        href="/"
        className="absolute left-6 top-6 lowercase text-[14px] text-black/40 transition-colors hover:text-black"
      >
        ← back to home
      </Link>

      <div className="relative flex max-w-[560px] flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lowercase text-[clamp(15px,1.4vw,18px)] text-black/45"
        >
          [ welcome ]
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-6 lowercase text-[clamp(38px,7vw,68px)] leading-[1.0] tracking-[-0.05em]"
        >
          where does your <span className="italic text-black/45">money sleep?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 max-w-[420px] lowercase text-[clamp(15px,1.4vw,18px)] leading-snug text-black/50"
        >
          wake it up. earn yield. own real assets. no bank, no broker, no lock.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex w-full max-w-[380px] flex-col items-center gap-3"
        >
          <button
            onClick={handleLogin}
            disabled={!ready || authenticated}
            className="w-full rounded-full bg-black px-8 py-3.5 lowercase text-[16px] font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30"
          >
            {authenticated ? "redirecting…" : "continue"}
          </button>

          <span className="lowercase text-[13px] text-black/35">
            email · phantom · solflare · backpack
          </span>
        </motion.div>
      </div>
    </div>
  );
}
