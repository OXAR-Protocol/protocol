import { PublicKey } from "@solana/web3.js";
export declare const PROGRAM_ID: PublicKey;
export declare const RPC_URL = "https://api.devnet.solana.com";
export declare const INITIAL_NAV = 1000000;
export declare const NAV_PRECISION = 1000000;
export declare const USDC_DECIMALS = 6;
type RiskLevel = "low" | "medium" | "high";
type Chain = "solana" | "ethereum";
export interface YieldSourceConfig {
    readonly id: string;
    readonly name: string;
    readonly description: string;
    readonly chain: Chain;
    readonly baseApy: number;
    readonly riskLevel: RiskLevel;
    readonly viaDelora: boolean;
    readonly available: boolean;
}
export declare const YIELD_SOURCES: readonly YieldSourceConfig[];
export type ApyBucket = "sleepy" | "walking" | "running";
export interface ApyBucketConfig {
    readonly id: ApyBucket;
    readonly label: string;
    readonly emoji: string;
    readonly description: string;
    /** Returns true if a yield source falls into this bucket by APY. */
    readonly matches: (apy: number) => boolean;
}
export declare const APY_BUCKETS: readonly ApyBucketConfig[];
export declare function getYieldSourceById(id: string): YieldSourceConfig | undefined;
/** Stable vault_id derived from yield-source id. Used for vault PDA. */
export declare function vaultIdForYieldSource(yieldSourceId: string): bigint;
export {};
