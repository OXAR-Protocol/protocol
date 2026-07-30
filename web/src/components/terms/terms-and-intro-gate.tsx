"use client";

import { useTermsGate } from "@/hooks/use-terms-gate";
import { useSolanaContext } from "@/providers/solana-provider";
import { TermsGateModal } from "@/components/terms/terms-gate-modal";
import { TermsBlocked } from "@/components/terms/terms-blocked";
import { IntroModal } from "@/components/intro-modal";

/**
 * Terms gate, then welcome — never both on screen (see `AppLayout`, which
 * mounts this in place of a bare `<IntroModal />`). While a wallet hasn't
 * agreed to the current `TERMS_VERSION`, this renders the gate (or, after a
 * decline, the blocked state) and withholds `IntroModal` entirely; once the
 * gate hook reports "hidden" — agreed just now, or already agreed on a past
 * visit — this renders exactly the ordinary first-run welcome, unchanged.
 */
export function TermsAndIntroGate() {
  const { walletAddress } = useSolanaContext();
  const { status, agree, decline, reopen } = useTermsGate();

  if (status === "gate") {
    return (
      <TermsGateModal
        walletAddress={walletAddress?.toBase58() ?? ""}
        onAgree={agree}
        onDecline={decline}
      />
    );
  }

  if (status === "blocked") {
    return <TermsBlocked onReviewTerms={reopen} />;
  }

  return <IntroModal />;
}
