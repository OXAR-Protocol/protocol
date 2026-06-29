"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ComingSoon, type Standing } from "@/components/access-gate/coming-soon";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Denial = { onWaitlist: boolean; standing: Standing | null };

export default function LoginPage() {
  const { login, authenticated, ready } = usePrivy();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState<Denial | null>(null);

  useEffect(() => {
    if (ready && authenticated) router.replace("/home");
  }, [ready, authenticated, router]);

  const valid = EMAIL_RE.test(email.trim());

  // Gate first: a Privy wallet is only handed out to allowlisted emails. A
  // non-allowlisted email never reaches Privy — it sees "coming soon" instead.
  const handleContinue = async () => {
    const value = email.trim().toLowerCase();
    if (!EMAIL_RE.test(value) || checking || !ready || authenticated) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch("/api/access/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const j = (await res.json()) as {
        allowed?: boolean;
        onWaitlist?: boolean;
        serial?: number;
        refCode?: string | null;
        rank?: Standing["rank"];
      };
      if (j.allowed) {
        // Mark this browser gate-approved so the post-login backstop also lets a
        // wallet login through (a wallet carries no email to re-check).
        try {
          window.localStorage.setItem("oxar.gatepass.v1", value);
        } catch {
          /* ignore */
        }
        // Approved — hand off to the normal Privy registration (email or wallet).
        login({ walletChainType: "solana-only" });
      } else {
        // Clear any stale gate pass so a now-revoked email loses access.
        try {
          window.localStorage.removeItem("oxar.gatepass.v1");
        } catch {
          /* ignore */
        }
        setDenied({
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

  if (denied) {
    return (
      <ComingSoon
        email={email.trim().toLowerCase()}
        onWaitlist={denied.onWaitlist}
        standing={denied.standing}
        onBack={() => {
          setDenied(null);
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
              if (e.key === "Enter") handleContinue();
            }}
            placeholder="you@email.com"
            disabled={!ready || authenticated || checking}
            className="h-12 w-full rounded-full border border-black/15 bg-transparent px-5 lowercase text-[16px] text-black placeholder:text-black/30 outline-none transition-colors focus:border-black/60 disabled:opacity-50"
          />
          {/* v2: account must be a Solana wallet (email → embedded, or a Solana
              wallet you log in with). EVM wallets are linked later only to PAY. */}
          <button
            onClick={handleContinue}
            disabled={!ready || authenticated || checking || !valid}
            className="w-full rounded-full bg-black px-8 py-3.5 lowercase text-[16px] font-medium text-white transition-colors hover:bg-black/85 disabled:cursor-not-allowed disabled:bg-black/10 disabled:text-black/30"
          >
            {authenticated ? "redirecting…" : checking ? "checking…" : "continue"}
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
