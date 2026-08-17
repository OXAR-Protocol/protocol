"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

import { TermsGateModal } from "@/components/terms/terms-gate-modal";
import { handOffToWallet, hasAgreedInBrowser, rememberBrowserAgreement } from "@/hooks/use-terms-gate";
import { useT } from "@/lib/i18n";

// The fallback runs the action ungated, which would be a hole if it were
// reachable. It is not: Privy lives in `Providers`, this provider is its direct
// child, and nothing outside that tree can start a login at all — the marketing
// pages have no Privy and no sign-in. Keep it that way, or move this check to
// wherever `login()` becomes callable.
const Ctx = createContext<(action: () => void) => void>((action) => action());

/**
 * The terms, before the account exists.
 *
 * They used to be shown after sign-in, because the acceptance record is keyed to
 * a wallet and there is no wallet until Privy has run. Which meant the order was:
 * hand over an email, get a wallet created, and *then* be asked whether the terms
 * are acceptable — and if the answer was no, we had already made an account for
 * someone who never agreed to anything.
 *
 * So the gate moved in front. Nothing is created until the box is ticked: press
 * "connect", read, agree, and only then does Privy open.
 *
 * Before sign-in the agreement can only be remembered per browser — there is no
 * wallet to key it to. The per-wallet gate downstream is unchanged and still
 * catches a different wallet connecting later; `handOffToWallet` is what stops
 * the same person being asked twice in the same breath.
 */
export function SignInGateProvider({ children }: { children: ReactNode }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const guard = useCallback((action: () => void) => {
    if (hasAgreedInBrowser()) {
      action();
      return;
    }
    pending.current = action;
    setOpen(true);
  }, []);

  const agree = () => {
    rememberBrowserAgreement();
    handOffToWallet();
    setOpen(false);
    const run = pending.current;
    pending.current = null;
    run?.();
  };

  // Declining here is not the "blocked" state the in-app gate uses. Nothing has
  // been created, so there is nothing to withhold — the sheet just closes and
  // they carry on looking around.
  const decline = () => {
    pending.current = null;
    setOpen(false);
  };

  return (
    <Ctx.Provider value={guard}>
      {children}
      {open && (
        <TermsGateModal
          onAgree={agree}
          onDecline={decline}
          declineLabel={t("terms.gate.notNow")}
        />
      )}
    </Ctx.Provider>
  );
}

/**
 * Wraps anything that would open Privy. Runs the action straight away once this
 * browser has agreed to the current `TERMS_VERSION`; otherwise shows the terms
 * and runs it only if they agree.
 */
export function useSignInGate(): (action: () => void) => void {
  return useContext(Ctx);
}
