"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import type { Rank } from "@/hooks/use-waitlist";
import { ComingSoon, type Standing } from "./coming-soon";

// Routes that must render without an allowlist check (you log in here).
const PUBLIC_APP_PATHS = ["/login"];

type Status = "loading" | "allowed" | "denied";
type Denial = { onWaitlist: boolean; standing: Standing | null };

interface CheckResult {
  allowed?: boolean;
  onWaitlist?: boolean;
  serial?: number;
  refCode?: string | null;
  rank?: Rank | null;
}

const CACHE_KEY = "oxar.allow.v1";
// Set by the pre-login /login gate once an email passes the allowlist. Honoured
// here so a wallet login (which carries no email) isn't re-denied after the
// user already cleared the gate. Cleared by the gate on a denied email.
const GATEPASS_KEY = "oxar.gatepass.v1";

/**
 * Closed-alpha barrier. After Privy login, checks the signed-in email against
 * the `allowlist` table (server-side). Allowlisted → app; otherwise → coming
 * soon. Replaces the old invite-key gate.
 */
export function AllowlistGate({ children }: { children: ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("loading");
  const [denial, setDenial] = useState<Denial>({ onWaitlist: false, standing: null });

  const email = user?.email?.address?.toLowerCase() ?? null;
  const isPublic = PUBLIC_APP_PATHS.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!ready || !authenticated) return;
    // Wallet login carries no email — honor the pre-login gate pass instead of an
    // allowlist lookup (the gate already approved an email in this browser).
    // Email logins below are still validated against the allowlist directly.
    if (!email) {
      let pass = false;
      try {
        pass = !!window.localStorage.getItem(GATEPASS_KEY);
      } catch {
        /* ignore */
      }
      setStatus(pass ? "allowed" : "denied");
      return;
    }
    // Warm from cache to avoid a flash on reload / navigation.
    try {
      if (window.localStorage.getItem(CACHE_KEY) === email) {
        setStatus("allowed");
        return;
      }
    } catch {
      /* ignore */
    }
    let cancelled = false;
    setStatus("loading");
    fetch("/api/access/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((r) => r.json())
      .then((j: CheckResult) => {
        if (cancelled) return;
        if (j.allowed) {
          try {
            window.localStorage.setItem(CACHE_KEY, email);
          } catch {
            /* ignore */
          }
          setStatus("allowed");
        } else {
          setDenial({
            onWaitlist: !!j.onWaitlist,
            standing:
              j.onWaitlist && typeof j.serial === "number"
                ? { serial: j.serial, refCode: j.refCode ?? null, rank: j.rank ?? null }
                : null,
          });
          setStatus("denied");
        }
      })
      .catch(() => !cancelled && setStatus("denied"));
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, email]);

  // Login page renders freely so users can authenticate.
  if (isPublic) return <>{children}</>;

  // Not logged in yet — AuthGuard is redirecting to /login. Avoid flashing app.
  if (!ready || !authenticated || status === "loading") {
    return (
      <div className="fixed inset-0 z-50 bg-surface-0 flex items-center justify-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.35em] text-white/30">
          Loading
        </span>
      </div>
    );
  }

  if (status === "denied")
    return (
      <ComingSoon
        email={email}
        onWaitlist={denial.onWaitlist}
        standing={denial.standing}
      />
    );

  return <>{children}</>;
}
