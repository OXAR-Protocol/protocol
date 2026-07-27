/**
 * Beta-asset access matching.
 *
 * A source marked `beta` is hidden from everyone but a short allowlist, so a new
 * asset can be piloted with real money before the whole alpha sees it. Matching is
 * by the identity the user signed in with — email (Privy embedded wallet) or the
 * wallet address (external wallet) — because either is possible: the closed-alpha
 * wall sits outside Privy, so login can be email OR wallet.
 *
 * This is a VISIBILITY gate, not a security boundary: the assets are public tokens
 * on public DEXes and every action is signed by the user's own wallet. It exists so
 * testers don't wander into a pilot, which is why the check lives server-side (out
 * of the client bundle) but needs no authentication.
 */
export interface BetaAccessConfig {
    /** Allowlisted sign-in emails (case-insensitive). */
    readonly emails: readonly string[];
    /** Allowlisted wallet addresses (base58, case-SENSITIVE — base58 is). */
    readonly wallets: readonly string[];
}
/** Parse a comma/space-separated env value into a clean list. */
export declare function parseBetaList(raw: string | undefined): string[];
/** Whether this identity is on the beta allowlist. Both inputs may be absent —
 *  a user with neither is simply not allowlisted (fails closed). */
export declare function isBetaIdentity(identity: {
    email?: string | null;
    wallet?: string | null;
}, config: BetaAccessConfig): boolean;
