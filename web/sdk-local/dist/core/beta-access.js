"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBetaList = parseBetaList;
exports.isBetaIdentity = isBetaIdentity;
/** Parse a comma/space-separated env value into a clean list. */
function parseBetaList(raw) {
    if (!raw)
        return [];
    return raw
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
}
/** Whether this identity is on the beta allowlist. Both inputs may be absent —
 *  a user with neither is simply not allowlisted (fails closed). */
function isBetaIdentity(identity, config) {
    const email = identity.email?.trim().toLowerCase();
    if (email && config.emails.some((e) => e.trim().toLowerCase() === email))
        return true;
    const wallet = identity.wallet?.trim();
    // Base58 is case-sensitive, so compare exactly — lowercasing would let a
    // near-miss address through.
    return !!wallet && config.wallets.some((w) => w.trim() === wallet);
}
