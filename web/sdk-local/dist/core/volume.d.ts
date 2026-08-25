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
import { type DeltaSource } from "./wallet-deltas";
/** The transaction fields this needs on top of the movement itself. */
export interface DatedTx extends DeltaSource {
    signature?: string;
    /** Unix SECONDS, per the Helius enhanced API. */
    timestamp?: number;
    /** Who paid the network fee. Our relayer paying it is a signature we can read. */
    feePayer?: string;
}
/**
 * How we know a transaction came through us.
 *
 * The chain is the honest source for the AMOUNT and a useless one for the AUTHOR:
 * a wallet that trades on Jupiter directly leaves a transaction indistinguishable
 * from one our screen built, and counting those makes "our volume" a number about
 * other people's apps.
 *
 * `relayer` — our gasless relayer paid the fee. Nothing else can put that address
 * there, so it is proof rather than a guess, and it covers the ordinary path: a
 * wallet with no SOL, which is most of them.
 * `recorded` — the browser told us about this signature. Weaker (a closed tab never
 * reports) but never wrong in the other direction.
 * `unknown` — someone else's app, or ours on a path we cannot yet mark.
 */
export type FlowOrigin = "relayer" | "recorded" | "unknown";
/** What lets a transaction be recognised as ours. */
export interface Attribution {
    /** Fee-payer addresses that only ever appear on transactions we built. */
    relayers?: ReadonlySet<string>;
    /** Signatures the client reported to `/api/track`. */
    recorded?: ReadonlySet<string>;
}
/** One transaction's money movement, in stable-coin units (≈ USD). */
export interface Flow {
    sig: string;
    /** Unix seconds. */
    ts: number;
    /** Stable coin that LEFT the wallet — money put into a position. */
    spentUsd: number;
    /** Stable coin that ARRIVED — money taken back out. */
    receivedUsd: number;
    origin: FlowOrigin;
}
/** Proof first, then our own record, then nothing. */
export declare function flowOrigin(tx: DatedTx, attribution?: Attribution): FlowOrigin;
/** Whether a flow happened through us at all. */
export declare function isOurs(flow: Flow): boolean;
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
export declare function txFlow(tx: DatedTx, owner: string, stableMints: ReadonlySet<string>, attribution?: Attribution): Flow | null;
/** Every transaction in `txs` that moved money, oldest first. */
export declare function walletFlows(txs: readonly DatedTx[], owner: string, stableMints: ReadonlySet<string>, attribution?: Attribution): Flow[];
export interface VolumeTotals {
    spentUsd: number;
    receivedUsd: number;
    /** Both directions added — the money that crossed the wallet's edge. */
    volumeUsd: number;
    /** Spent minus received: what is still out there working. */
    netUsd: number;
    transactions: number;
}
export declare function totalVolume(flows: readonly Flow[]): VolumeTotals;
/**
 * The newest timestamp in a set of flows — where the next sync starts reading.
 *
 * Returns 0 for an empty set, which reads as "no cursor yet" and makes the next
 * sync page the wallet's whole life. That is the correct behaviour for a wallet we
 * have never synced, and harmless for one that has simply done nothing: paging
 * stops at the end of a short history in one request.
 */
export declare function newestTs(flows: readonly Flow[]): number;
