"use client";

import { useEffect, useState } from "react";

import { TERMS_VERSION } from "@oxar/sdk";
import { useSolanaContext } from "@/providers/solana-provider";
import { acceptTerms } from "@/lib/terms";

/**
 * Per WALLET, per TERMS_VERSION — same "don't key it to the browser" reasoning
 * as `useIntro`'s `seenKey` (a second person on the device, or a wallet that
 * didn't exist yet, must not inherit someone else's acceptance). Folding the
 * version into the key means bumping `TERMS_VERSION` asks again on its own —
 * no migration or explicit "expire the old rows" step needed, this key is
 * simply new.
 */
const acceptedKey = (owner: string, version: string) => `oxar:terms-accepted:${version}:${owner}`;

/** Set the moment a pre-sign-in agreement happens, cleared the first time a
 *  wallet shows up. Without it the same person agrees, gets a wallet a second
 *  later, and is asked the identical question again. */
const handOffKey = (version: string) => `oxar:terms-handoff:${version}`;

/** Arms the hand-off, so the wallet that appears next inherits this agreement. */
export function handOffToWallet(): void {
  try {
    localStorage.setItem(handOffKey(TERMS_VERSION), "1");
  } catch {
    /* the per-wallet gate will simply ask */
  }
}

/** Consumes the hand-off for `owner`, once. Deliberately single-use: a wallet
 *  connecting days later must not inherit an agreement it was never part of. */
function claimHandOff(owner: string): boolean {
  try {
    if (!localStorage.getItem(handOffKey(TERMS_VERSION))) return false;
    localStorage.removeItem(handOffKey(TERMS_VERSION));
    localStorage.setItem(acceptedKey(owner, TERMS_VERSION), "1");
    return true;
  } catch {
    return false;
  }
}

export type TermsGateStatus =
  /** No wallet yet, or this wallet already accepted the current version. */
  | "hidden"
  /** Showing the scrollable terms + checkbox + agree/decline. */
  | "gate"
  /** Declined: the app is deliberately withheld until they come back and agree. */
  | "blocked";

/**
 * Drives the in-app terms gate. Shows before the welcome/tour (see
 * `TermsAndIntroGate`, which composes this with `IntroModal`) for any wallet
 * that hasn't agreed to `TERMS_VERSION` yet.
 *
 * Recording is best-effort and NEVER the thing that gates access — `agree()`
 * writes the local flag and flips to "hidden" unconditionally, then fires
 * `acceptTerms` without awaiting it. A down API, a missing migration, or being
 * offline must never re-lock someone who just agreed (see `lib/terms.ts`).
 */
export function useTermsGate(): {
  status: TermsGateStatus;
  agree: () => void;
  decline: () => void;
  reopen: () => void;
} {
  const { walletAddress } = useSolanaContext();
  const owner = walletAddress?.toBase58() ?? null;
  const [status, setStatus] = useState<TermsGateStatus>("hidden");

  useEffect(() => {
    if (!owner) {
      setStatus("hidden");
      return;
    }
    try {
      // A pre-sign-in agreement, claimed once, for the wallet it produced.
      if (claimHandOff(owner)) {
        setStatus("hidden");
        acceptTerms(owner);
        return;
      }
      setStatus(localStorage.getItem(acceptedKey(owner, TERMS_VERSION)) ? "hidden" : "gate");
    } catch {
      // Private mode / storage blocked — don't gate what we can't remember,
      // or this would show every single render instead of once.
      setStatus("hidden");
    }
  }, [owner]);

  const agree = () => {
    if (!owner) return;
    try {
      localStorage.setItem(acceptedKey(owner, TERMS_VERSION), "1");
    } catch {
      // Can't remember it → the gate shows again next time. Annoying, not broken.
    }
    setStatus("hidden");
    acceptTerms(owner);
  };

  const decline = () => setStatus("blocked");
  const reopen = () => setStatus("gate");

  return { status, agree, decline, reopen };
}
