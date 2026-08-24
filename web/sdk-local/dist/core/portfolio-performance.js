"use strict";
/**
 * What the portfolio earned, and what percent that is.
 *
 * Everything here rests on one identity. Value is `balance × price`, so between two
 * days it can only move for two reasons:
 *
 *   V(d) − V(d−1) = Σ bal(d−1)×[P(d)−P(d−1)]  +  Σ [bal(d)−bal(d−1)]×P(d)
 *                   └────── earned ──────┘        └──────── flow ───────┘
 *
 * Two things follow, and they are the whole reason this file exists. Earnings never
 * need a settlement leg — only balances and prices — so a trade paid in USDT or swapped
 * token-for-token counts exactly like any other, where pricing an event by its USDC side
 * drops it. And yield arrives for free: Jupiter Lend pays by making jlUSDC worth more,
 * not by sending more of it, so its interest is a price move like any other.
 *
 * A balance moves for two very different reasons, though, and a day cannot tell them
 * apart: money arriving from outside, and one thing you own turning into another. So
 * flows are read per TRANSACTION, by the direction of its legs. That distinction is the
 * difference between reporting a swap's spread as a $1 loss (true) and as a $1
 * withdrawal (what a day-level view concludes, and it is wrong).
 *
 * See docs/plans/2026-07-31-portfolio-performance-design.md.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.portfolioSeries = portfolioSeries;
const portfolio_history_1 = require("./portfolio-history");
const DAY = 86400;
/** A balance this far below zero means the replay ran past the history we were given —
 *  not that the wallet owed anything. Everything older is unknown, not zero. */
const BALANCE_FLOOR = -1e-6;
/**
 * Daily performance for the last `days`, oldest first.
 *
 * `balancesNow` should be READ, not inferred: seeding the backward replay from the
 * wallet's actual balances is what keeps today's figure equal to the one on the rest
 * of the screen.
 *
 * Days the transaction history doesn't reach are dropped rather than guessed, and the
 * reach is bounded from both sides. A holding that goes negative means we missed the
 * inflow that started it — that is BALANCE_FLOOR, and it needs no help from the caller.
 * The other side is invisible from in here: undoing withdrawals only ever makes the
 * past look richer, so a wallet that has taken out more than it put in reconstructs a
 * balance for days it never existed. `bornAt` is how the caller closes that door.
 */
function portfolioSeries(params) {
    const { now, days, balancesNow, txs, prices, bornAt } = params;
    const mints = new Set(Object.keys(balancesNow));
    for (const tx of txs)
        for (const m of Object.keys(tx.legs))
            mints.add(m);
    // Day boundaries, newest first: bounds[k] = k days ago. bounds[days] is a seed — the
    // close before the first day we report, so that day has a "previous" to measure from.
    const bounds = Array.from({ length: days + 1 }, (_, k) => now - k * DAY);
    // Walk backwards, undoing each transaction to recover the balances at every boundary.
    const balances = [{ ...balancesNow }];
    const perInterval = [[]];
    const newestFirst = [...txs].sort((a, b) => b.timestamp - a.timestamp);
    let next = 0;
    for (let k = 1; k <= days; k++) {
        const at = { ...balances[k - 1] };
        const inside = [];
        while (next < newestFirst.length && newestFirst[next].timestamp > bounds[k]) {
            const tx = newestFirst[next];
            inside.push(tx);
            for (const [mint, delta] of Object.entries(tx.legs))
                at[mint] = (at[mint] ?? 0) - delta;
            next++;
        }
        perInterval[k] = inside;
        balances[k] = at;
    }
    // How far back the history actually reaches: the oldest boundary we can state without
    // a negative holding, which would mean we're subtracting moves we never saw the start of.
    let oldest = days;
    while (oldest > 0 && Object.values(balances[oldest]).some((b) => b < BALANCE_FLOOR))
        oldest--;
    // …and the same question from the other side, which that check cannot see.
    //
    // A negative holding is what an unseen INFLOW looks like when you replay backwards.
    // An unseen OUTFLOW looks like nothing at all: undoing a withdrawal adds the money
    // back, so the reconstruction simply grows the further back it goes and never trips
    // the floor. On a wallet that has taken more out than it put in, that produces a
    // balance of `today + everything withdrawn − everything deposited`, flat, stretching
    // to the left edge of whatever range was asked for. Reported from a two-month-old
    // account, a one-year chart opened at $5,840 on a day the wallet did not yet exist.
    //
    // The arithmetic is identical to the case it must NOT break — "you sold 50 on
    // Tuesday, so you held 50 on Monday" is the same undo, and it is correct. What
    // separates them is only whether the wallet existed back there, and no amount of
    // staring at these numbers reveals that. So the caller says: `bornAt` is passed
    // when, and only when, the history behind `txs` was read to its end, which makes
    // the oldest transaction in it the wallet's first.
    if (bornAt !== undefined) {
        // Day k closes at bounds[k - 1]. Keep the days whose close is at or after the
        // wallet's first transaction, so the oldest point plotted already contains it.
        const bounded = Math.floor((now - bornAt) / DAY) + 1;
        oldest = Math.max(0, Math.min(oldest, bounded));
    }
    const out = [];
    for (let k = oldest; k >= 1; k--) {
        const openedAt = bounds[k];
        const closedAt = bounds[k - 1];
        const opening = balances[k];
        const closing = balances[k - 1];
        // Priced once per mint per day; the loops below all read the same two numbers.
        const before = {};
        const after = {};
        for (const mint of mints) {
            before[mint] = (0, portfolio_history_1.priceAt)(prices[mint] ?? [], openedAt);
            after[mint] = (0, portfolio_history_1.priceAt)(prices[mint] ?? [], closedAt);
        }
        const perMint = {};
        const credit = (mint, amount) => {
            if (amount !== 0)
                perMint[mint] = (perMint[mint] ?? 0) + amount;
        };
        let marketUsd = 0;
        let usd = 0;
        let capitalUsd = 0;
        for (const mint of mints) {
            const held = opening[mint] ?? 0;
            const moved = held * (after[mint] - before[mint]);
            marketUsd += moved;
            credit(mint, moved);
            capitalUsd += held * before[mint];
            usd += (closing[mint] ?? 0) * after[mint];
        }
        let costUsd = 0;
        let inUsd = 0;
        let outUsd = 0;
        for (const tx of perInterval[k] ?? []) {
            let value = 0;
            let acquired = 0;
            let sent = false;
            for (const [mint, delta] of Object.entries(tx.legs)) {
                const legValue = delta * (after[mint] ?? 0);
                value += legValue;
                if (delta > 0)
                    acquired += legValue;
                else if (delta < 0)
                    sent = true;
            }
            // Both directions AND something we can price on the receiving end: one thing you
            // own became another. If we can't price what came back, this falls through to a
            // flow instead — money going somewhere we can't see reads as leaving, which is
            // true, rather than as a loss the size of the whole trade, which isn't.
            if (acquired > 0 && sent) {
                // Nothing entered or left; what the exchange cost is the whole of its value
                // change — and it belongs to the holding it bought, because that is what the
                // money was spent getting into.
                costUsd += value;
                for (const [mint, delta] of Object.entries(tx.legs)) {
                    if (delta > 0)
                        credit(mint, value * ((delta * (after[mint] ?? 0)) / acquired));
                }
            }
            else {
                if (value > 0)
                    inUsd += value;
                else
                    outUsd += -value;
                capitalUsd += value * ((closedAt - tx.timestamp) / DAY);
            }
        }
        out.push({
            t: closedAt,
            usd: (0, portfolio_history_1.isDustUsd)(usd) ? 0 : usd,
            earnedUsd: marketUsd + costUsd,
            marketUsd,
            costUsd,
            perMint,
            inUsd,
            outUsd,
            capitalUsd,
        });
    }
    return out;
}
