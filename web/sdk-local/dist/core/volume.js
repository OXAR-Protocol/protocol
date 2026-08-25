"use strict";
/**
 * How much money actually moved, read from the chain rather than from us.
 *
 * The `events` table records what the user ASKED for: the amount typed into the
 * field, posted from their browser after the transaction confirmed. Both halves of
 * that are unreliable. The amount is an intention — a swap clamped to the spendable
 * balance spends less than was typed — and the post is fire-and-forget, so a closed
 * tab is a transaction we never hear about. One row recorded a $11.45 buy as
 * $7,997.15, the typed figure multiplied by the price of the asset being bought;
 * that single row was 92% of our reported volume for two months.
 *
 * A settled transaction cannot be wrong about itself. `walletDeltas` already reduces
 * one to its net effect per mint, so volume is a question about the stable leg of
 * that: what the wallet paid, or what came back.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.txFlow = txFlow;
exports.walletFlows = walletFlows;
exports.totalVolume = totalVolume;
exports.newestTs = newestTs;
const wallet_deltas_1 = require("./wallet-deltas");
/**
 * Below this, a leg is rounding rather than a trade. Stable coins carry six
 * decimals and a route's dust can land a hundredth of a cent on either side.
 */
const DUST = 0.01;
/**
 * One transaction's flow, or null when it isn't one.
 *
 * A stable leg on its own is not volume. Receiving USDC from the on-ramp, sending
 * some to a friend, being airdropped anything — each moves the stable coin without
 * a position on the other side of it, and counting those would turn a wallet's
 * housekeeping into our trading figures. What makes it a trade is the OTHER side:
 * some non-stable mint moving the opposite way in the same transaction. A deposit
 * pays stable and receives a receipt token; a withdrawal burns the receipt and is
 * paid stable. A transfer has no counterpart and is skipped.
 *
 * `stableMints` is a BASKET, not one mint, and the difference is worth $2,459 on a
 * wallet we actually hold. Swapping USDG for USDC is a wallet changing which dollar
 * it holds; read one mint at a time it looks like $2,459 of stock being sold, and it
 * was the largest "trade" in our history. Netted across the basket the same
 * transaction is a $21 spread with no position on either side of it, and drops out.
 */
function txFlow(tx, owner, stableMints) {
    const sig = tx.signature;
    const ts = tx.timestamp;
    if (!sig || typeof ts !== "number" || ts <= 0)
        return null;
    const legs = (0, wallet_deltas_1.walletDeltas)(tx, owner);
    let stable = 0;
    for (const [mint, amount] of Object.entries(legs))
        if (stableMints.has(mint))
            stable += amount;
    if (Math.abs(stable) < DUST)
        return null;
    const hasCounterpart = Object.entries(legs).some(([mint, amount]) => !stableMints.has(mint) && Math.sign(amount) === -Math.sign(stable) && amount !== 0);
    if (!hasCounterpart)
        return null;
    return {
        sig,
        ts,
        spentUsd: stable < 0 ? -stable : 0,
        receivedUsd: stable > 0 ? stable : 0,
    };
}
/** Every transaction in `txs` that moved money, oldest first. */
function walletFlows(txs, owner, stableMints) {
    const flows = [];
    for (const tx of txs) {
        const flow = txFlow(tx, owner, stableMints);
        if (flow)
            flows.push(flow);
    }
    return flows.sort((a, b) => a.ts - b.ts);
}
function totalVolume(flows) {
    let spentUsd = 0;
    let receivedUsd = 0;
    for (const f of flows) {
        spentUsd += f.spentUsd;
        receivedUsd += f.receivedUsd;
    }
    return {
        spentUsd,
        receivedUsd,
        volumeUsd: spentUsd + receivedUsd,
        netUsd: spentUsd - receivedUsd,
        transactions: flows.length,
    };
}
/**
 * The newest timestamp in a set of flows — where the next sync starts reading.
 *
 * Returns 0 for an empty set, which reads as "no cursor yet" and makes the next
 * sync page the wallet's whole life. That is the correct behaviour for a wallet we
 * have never synced, and harmless for one that has simply done nothing: paging
 * stops at the end of a short history in one request.
 */
function newestTs(flows) {
    let newest = 0;
    for (const f of flows)
        if (f.ts > newest)
            newest = f.ts;
    return newest;
}
