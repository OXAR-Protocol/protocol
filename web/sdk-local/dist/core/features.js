"use strict";
/**
 * Feature visibility.
 *
 * Real users are on the app while we merge, so work in progress ships DARK: the
 * code is in production, invisible, and switched on for a couple of insiders first
 * — the way ONyc was piloted before it went public. Turning something on is an
 * environment change, not a deploy.
 *
 * Three states, which is all we actually need:
 *   - dark      — in no list; nobody sees it
 *   - insiders  — in `insiderFeatures`; visible to the allowlisted identities
 *   - public    — in `publicFeatures`; visible to everyone
 *
 * This is a VISIBILITY gate, not a security boundary: every action is still signed
 * by the user's own wallet. It lives server-side so the allowlist never ships in
 * the client bundle. It also cannot protect a change to shared money-path code —
 * that runs for everyone regardless of what the UI shows.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseList = parseList;
exports.isInsider = isInsider;
exports.resolveFeatures = resolveFeatures;
/** Parse a comma/space-separated env value into a clean list. */
function parseList(raw) {
    if (!raw)
        return [];
    return raw
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);
}
/** Whether this identity is an insider. Neither field set → not one (fails closed). */
function isInsider(identity, config) {
    const email = identity.email?.trim().toLowerCase();
    if (email && config.insiderEmails.some((e) => e.trim().toLowerCase() === email))
        return true;
    const wallet = identity.wallet?.trim();
    // Base58 is case-sensitive — comparing case-insensitively would admit a near-miss.
    return !!wallet && config.insiderWallets.some((w) => w.trim() === wallet);
}
/**
 * Feature keys this identity may see: everything public, plus the insider set when
 * they qualify. Deduped, so a key promoted to public while still listed for
 * insiders appears once.
 */
function resolveFeatures(identity, config) {
    const keys = new Set(config.publicFeatures.map((k) => k.trim()).filter(Boolean));
    if (isInsider(identity, config)) {
        for (const k of config.insiderFeatures) {
            const key = k.trim();
            if (key)
                keys.add(key);
        }
    }
    return [...keys];
}
