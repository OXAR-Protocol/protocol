/**
 * Fire-and-forget money-flow analytics. Called after a money action confirms.
 * NEVER throws or blocks — analytics must not affect the user's transaction.
 * Deduped server-side by `sig`, so calling twice for the same tx is harmless.
 */
export interface TrackEvent {
  wallet: string;
  kind: "deposit" | "withdraw" | "buy" | "send";
  asset?: string;
  usd?: number;
  sig?: string;
  chain?: "solana" | "ethereum";
}

export function trackEvent(e: TrackEvent): void {
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(e),
      keepalive: true, // survive navigation right after a buy
    }).catch(() => {});
  } catch {
    /* never surface analytics errors */
  }
}

/**
 * Attribute a wallet to the acquisition channel it arrived through (the invite code:
 * "superteam-alpha", "dev3pack-alpha", …). One row per wallet — deduped server-side
 * on a synthetic key — so channels can later be joined to deposits by wallet.
 * Fire-and-forget; never throws.
 */
export function trackChannel(wallet: string, src: string): void {
  try {
    void fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ wallet, kind: "channel", asset: src }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never surface analytics errors */
  }
}
