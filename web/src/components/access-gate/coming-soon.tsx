"use client";

import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";

/**
 * Shown to a signed-in user whose email is not on the allowlist. Lets them see
 * which account they're on and log out to switch.
 */
export function ComingSoon({ email }: { email: string | null }) {
  const { logout } = usePrivy();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 bg-surface-0 flex items-center justify-center px-6 overflow-hidden"
    >
      <div
        aria-hidden
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(114,162,240,0.1), rgba(139,92,246,0.05), transparent)",
        }}
      />

      <div className="relative w-full max-w-[440px] flex flex-col items-center text-center gap-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30">
            Closed Alpha
          </span>
          <h1 className="font-sans font-normal text-[clamp(1.8rem,5vw,2.4rem)] leading-[1.1] text-white">
            Coming soon
          </h1>
          <p className="font-mono text-[11px] text-white/40 leading-relaxed max-w-[340px] mt-1">
            OXAR is in private alpha. We&apos;re opening access in waves — your
            account isn&apos;t active yet.
          </p>
          {email && (
            <p className="font-mono text-[10px] text-white/30 mt-2">
              Signed in as {email}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full flex flex-col gap-3"
        >
          <a
            href="https://oxar.app/#waitlist"
            className="w-full py-4 rounded-[4px] font-mono text-[11px] uppercase tracking-[0.25em] bg-white text-surface-0 hover:bg-white/90 transition-all"
          >
            Join the waitlist
          </a>
          <button
            onClick={() => logout()}
            className="w-full py-3 rounded-[4px] font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 hover:text-white border border-white/[0.08] hover:border-white/20 transition-all"
          >
            Log out
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
