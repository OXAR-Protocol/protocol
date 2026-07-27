"use strict";
/**
 * What a confirmed transaction actually moved.
 *
 * A success screen that echoes the amount the user ASKED for is a guess dressed as
 * a receipt: a sell quoted at $4.94 landed $4.84, and the screen still said $4.94.
 * The transaction itself carries the answer — pre/post token balances — so the
 * receipt can state the settled number instead of the intended one.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenDelta = tokenDelta;
/**
 * Net change in `owner`'s balance of `mint`, in base units. Positive = received.
 *
 * Sums across accounts, because a wallet can hold several token accounts for one
 * mint, and treats a missing PRE entry as zero — that is exactly the shape of an
 * account created by this transaction (a first-time buy), where the whole post
 * balance is the amount received.
 */
function tokenDelta(pre, post, owner, mint) {
    const sum = (entries) => {
        let total = BigInt(0);
        for (const e of entries ?? []) {
            if (e?.owner !== owner || e?.mint !== mint)
                continue;
            const raw = e.uiTokenAmount?.amount;
            if (typeof raw === "string" && /^\d+$/.test(raw))
                total += BigInt(raw);
        }
        return total;
    };
    return sum(post) - sum(pre);
}
