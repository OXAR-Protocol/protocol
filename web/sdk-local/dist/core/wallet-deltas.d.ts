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
/** One token account's net change inside a transaction (the fields we read). */
export interface TokenBalanceChange {
    /** Owner of the token account — NOT the account address. */
    userAccount?: string;
    mint?: string;
    rawTokenAmount?: {
        /** Signed integer, in base units, as a string. */
        tokenAmount?: string;
        decimals?: number;
    };
}
export interface AccountData {
    account?: string;
    tokenBalanceChanges?: TokenBalanceChange[];
}
export interface TransferLeg {
    fromUserAccount?: string;
    toUserAccount?: string;
    /** UI units, per the Helius enhanced API. */
    tokenAmount?: number;
    mint?: string;
}
export interface DeltaSource {
    accountData?: AccountData[];
    tokenTransfers?: TransferLeg[];
}
/** Net movement per mint, in UI units. Positive = the wallet received. */
export declare function walletDeltas(tx: DeltaSource, owner: string): Record<string, number>;
