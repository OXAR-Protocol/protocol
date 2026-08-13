"use strict";
/**
 * What one transaction did to a wallet, per mint.
 *
 * The obvious way is to add up the transfers whose sender or receiver is the
 * wallet, and it is wrong for the transaction that matters most here. A swap
 * routed through several pools moves the same dollars several times, and the
 * legs of that route can each name the owner's token account — so a $5 buy
 * arrives as "+$2,459", the sum of every hop rather than the one net change.
 * Both the history feed and the earnings engine read from this, so the same
 * inflated figure showed up as a transaction, as "cost to trade", and as a
 * percentage of a balance the wallet never had.
 *
 * A balance change cannot double-count: it is what the account held after minus
 * what it held before, whatever happened in between. Helius reports one per token
 * account touched, so summing the owner's own accounts gives the true net.
 *
 * `tokenTransfers` stays as a fallback for transactions where the richer field is
 * absent — for a simple send the two agree exactly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletDeltas = walletDeltas;
/** Net movement per mint, in UI units. Positive = the wallet received. */
function walletDeltas(tx, owner) {
    const fromBalances = balanceChangeDeltas(tx, owner);
    if (fromBalances !== null)
        return fromBalances;
    return transferDeltas(tx, owner);
}
/** Null when the transaction carries no balance-change data for this owner. */
function balanceChangeDeltas(tx, owner) {
    if (!tx.accountData?.length)
        return null;
    const deltas = {};
    let sawOwner = false;
    for (const account of tx.accountData) {
        for (const change of account.tokenBalanceChanges ?? []) {
            if (change.userAccount !== owner || !change.mint)
                continue;
            const raw = change.rawTokenAmount?.tokenAmount;
            const decimals = change.rawTokenAmount?.decimals;
            if (raw === undefined || decimals === undefined)
                continue;
            const amount = Number(raw) / 10 ** decimals;
            if (!Number.isFinite(amount))
                continue;
            sawOwner = true;
            deltas[change.mint] = (deltas[change.mint] ?? 0) + amount;
        }
    }
    // A transaction can legitimately touch none of the owner's token accounts (a plain
    // SOL transfer, say). That is an empty result, not a missing one — but only if the
    // field was there to read at all, which the caller above has established.
    return sawOwner ? deltas : {};
}
/** The old reading, kept for transactions without balance-change data. */
function transferDeltas(tx, owner) {
    const deltas = {};
    for (const leg of tx.tokenTransfers ?? []) {
        if (!leg.mint || typeof leg.tokenAmount !== "number")
            continue;
        const sign = leg.toUserAccount === owner ? 1 : leg.fromUserAccount === owner ? -1 : 0;
        if (sign === 0)
            continue;
        deltas[leg.mint] = (deltas[leg.mint] ?? 0) + sign * leg.tokenAmount;
    }
    return deltas;
}
