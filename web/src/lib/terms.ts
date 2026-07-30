import { isValidSolanaAddress } from "@/lib/wallet/transfer";

/**
 * Fire-and-forget acceptance record for /terms. Called when a wallet takes an
 * affirmative action on the welcome card (dismiss / skip / X, or starting the
 * tour) — see `components/intro-modal.tsx`. NEVER blocks or throws: a legal
 * record is not worth a broken front door, so the welcome card must dismiss
 * and the tour must start whether or not this call ever lands.
 *
 * This does not evidence a signature, and OXAR has no operating company to be
 * the counterparty for one — it only records that the wallet was shown
 * TERMS_VERSION and acted, at a point in time. If the migration hasn't been
 * applied yet, or Supabase is down, the request 500s server-side and this
 * still resolves silently — nothing here is awaited by the caller.
 */
export function acceptTerms(wallet: string): void {
  try {
    void fetch("/api/terms/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wallet }),
      keepalive: true, // survive navigation right after dismissing
    }).catch(() => {});
  } catch {
    /* never surface acceptance errors */
  }
}

/**
 * Validate + normalize the `wallet` field of a terms-accept request body.
 * Returns the trimmed address, or null if missing/malformed. Pure — reused by
 * the API route and covered directly by tests, rather than duplicating the
 * PublicKey try/catch that other routes each inline.
 */
export function parseTermsWallet(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return isValidSolanaAddress(trimmed) ? trimmed : null;
}
