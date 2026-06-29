"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ComingSoon, type Standing } from "./coming-soon";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UNLOCK_KEY = "oxar.access.unlocked.v1";

type State = "loading" | "locked" | "unlocked";
type Denial = { onWaitlist: boolean; standing: Standing | null };

interface CheckResult {
  allowed?: boolean;
  onWaitlist?: boolean;
  serial?: number;
  refCode?: string | null;
  rank?: Standing["rank"];
}

/**
 * Closed-alpha access wall. Sits OUTSIDE Privy: an approved email (from the
 * waitlist allowlist) unlocks the app; everyone else gets the waitlist screen.
 * Once unlocked in this browser, the normal Privy login (email or wallet) runs
 * untouched — the wall never talks to Privy. This is what makes wallet login
 * work on mobile: Privy isn't even mounted until the wall is cleared, so a
 * wallet's in-app browser can't auto-login past it.
 */
export function AccessWall({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denial, setDenial] = useState<Denial | null>(null);

  useEffect(() => {
    try {
      setState(window.localStorage.getItem(UNLOCK_KEY) ? "unlocked" : "locked");
    } catch {
      setState("locked");
    }
  }, []);

  const valid = EMAIL_RE.test(email.trim());

  const submit = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || checking) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/access/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const j = (await res.json()) as CheckResult;
      if (j.allowed) {
        try {
          window.localStorage.setItem(UNLOCK_KEY, value);
        } catch {
          /* ignore */
        }
        setState("unlocked");
      } else {
        setDenial({
          onWaitlist: !!j.onWaitlist,
          standing:
            j.onWaitlist && typeof j.serial === "number"
              ? { serial: j.serial, refCode: j.refCode ?? null, rank: j.rank ?? null }
              : null,
        });
      }
    } catch {
      setError("something went wrong — try again");
    } finally {
      setChecking(false);
    }
  };

  if (state === "loading") return <div className="fixed inset-0 bg-white" />;
  if (state === "unlocked") return <>{children}</>;

  if (denial) {
    return (
      <ComingSoon
        email={email.trim().toLowerCase()}
        onWaitlist={denial.onWaitlist}
        standing={denial.standing}
        onBack={() => {
          setDenial(null);
          setError(null);
        }}
      />
    );
  }

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
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="you@email.com"
            disabled={checking}
            className="h-12 w-full rounded-full border border-black/15 bg-transparent px-5 lowercase text-[16px] text-black placeholder:text-black/30 outline-none transition-colors focus:border-black/60 disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={checking || !valid}
            className="w-full rounded-full bg-black px-8 py-3.5 lowercase text-[16px] font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30"
          >
            {checking ? "checking…" : "continue"}
          </button>

          {error && (
            <span className="lowercase text-[13px] text-[#D4313C]">{error}</span>
          )}

          <span className="lowercase text-[13px] text-black/35">
            email · phantom · solflare · backpack
          </span>
        </motion.div>
      </div>
    </div>
  );
}
