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
    <div className="mx-auto max-w-[1000px] pb-32 pt-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>how do you want to start?</SectionLabel>
        <h1 className="mt-4 max-w-2xl text-[clamp(28px,4.4vw,48px)] leading-[1.04] tracking-[-0.04em]">
          two ways in. same yield underneath.
        </h1>
        <p className="mt-3 max-w-md lowercase text-[clamp(15px,1.3vw,18px)] text-black/45">
          pick whichever fits. you can always add the other later.
        </p>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        {/* Wallet */}
        <button
          onClick={() => login()}
          disabled={!ready}
          className="rounded-[14px] border border-black/10 p-8 text-left transition-colors hover:border-black/30 disabled:opacity-50"
        >
          <Wallet className="mb-6 text-black/50" size={30} strokeWidth={1.5} />
          <h2 className="lowercase text-[clamp(20px,2.2vw,26px)] tracking-[-0.02em]">i have crypto</h2>
          <p className="mt-2 lowercase text-[clamp(14px,1.2vw,16px)] leading-snug text-black/50">
            phantom, metamask, backpack, or sign in with email — privy gives you
            a solana wallet either way.
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 lowercase text-[14px] font-medium text-[#3c05c7]">
            connect
            <ArrowRight size={15} strokeWidth={1.75} />
          </div>
        </button>

        {/* Apple Pay / Google Pay (coming soon) */}
        <div className="rounded-[14px] border border-black/10 p-8 text-left opacity-80">
          <Smartphone className="mb-6 text-black/50" size={30} strokeWidth={1.5} />
          <h2 className="lowercase text-[clamp(20px,2.2vw,26px)] tracking-[-0.02em]">just have a phone</h2>
          <p className="mt-2 lowercase text-[clamp(14px,1.2vw,16px)] leading-snug text-black/50">
            apple pay or google pay. we use ramp network to convert to usdc —
            lands directly in your non-custodial wallet.
          </p>
          <div className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1 lowercase text-[12px] tracking-wide text-black/45">
            coming with mvp
          </div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 lowercase text-[13px] text-black/35"
      >
        <span>non-custodial</span>
        <span className="opacity-50">·</span>
        <span>your keys, your money</span>
        <span className="opacity-50">·</span>
        <span>instant withdraw</span>
        <span className="opacity-50">·</span>
        <span>no bank required</span>
      </motion.section>
    </div>
  );
}
