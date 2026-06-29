"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { Rank } from "@/hooks/use-waitlist";
import { WaitlistForm } from "@/components/landing-v2/waitlist-form";
import { WaitlistSuccess } from "@/components/landing-v2/waitlist-success";

export interface Standing {
  serial: number;
  refCode: string | null;
  rank: Rank | null;
}

/**
 * Shown by the access wall to anyone not on the allowlist. Two states:
 *   • onWaitlist  → "you already took your spot" + their live referral standing.
 *   • not on list → the waitlist sign-up form (same logic as the landing page).
 * Privy-free on purpose: the wall lives outside the Privy provider.
 */
export function ComingSoon({
  email,
  onWaitlist,
  standing,
  onBack,
}: {
  email: string | null;
  onWaitlist: boolean;
  standing: Standing | null;
  onBack?: () => void;
}) {
  const shareUrl = useMemo(() => {
    if (!standing?.refCode || typeof window === "undefined") return null;
    return `${window.location.origin}/?ref=${standing.refCode}`;
  }, [standing?.refCode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-surface-0 px-6 py-16 text-white"
    >
      <div
        aria-hidden
        className="pointer-events-none fixed left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(114,162,240,0.1), rgba(139,92,246,0.05), transparent)",
        }}
      />

      <div className="relative mx-auto flex w-full max-w-[560px] flex-col items-center gap-6 text-center">
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30">
            Closed Alpha
          </span>
          <h1 className="font-sans text-[clamp(1.8rem,5vw,2.4rem)] font-normal leading-[1.1] text-white">
            {onWaitlist ? "You’re on the list" : "Coming soon"}
          </h1>
          <p className="mt-1 max-w-[380px] font-mono text-[11px] leading-relaxed text-white/40">
            {onWaitlist
              ? "You already claimed your spot. We’re opening access in waves — invite friends to move up the queue."
              : "OXAR is in private alpha. Join the waitlist to claim your spot — we’re opening access in waves."}
          </p>
        </div>

        {onWaitlist && standing ? (
          <WaitlistSuccess
            serial={standing.serial}
            shareUrl={shareUrl}
            rank={standing.rank}
            referred={false}
          />
        ) : (
          <div className="w-full">
            <WaitlistForm initialEmail={email ?? ""} />
          </div>
        )}

        <div className="mt-2 flex flex-col items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40 transition-colors hover:text-white/80"
            >
              &larr; Use a different email
            </button>
          )}
          {email && <p className="font-mono text-[10px] text-white/25">{email}</p>}
        </div>
      </div>
    </motion.div>
  );
}
