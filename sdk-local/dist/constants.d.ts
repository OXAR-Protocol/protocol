import { PublicKey } from "@solana/web3.js";
export declare const PROGRAM_ID: PublicKey;
export declare const RPC_URL = "https://api.devnet.solana.com";
export declare const DEFAULT_SERIES = 2;
export interface VaultConfig {
    readonly id: string;
    readonly region: string;
    readonly denomination: string;
    readonly assetSubtype: string;
    readonly series: number;
    readonly apy: number;
    readonly label: string;
    readonly isWar: boolean;
    readonly hasFxRisk: boolean;
}
export declare const VAULT_CONFIGS: readonly VaultConfig[];
export declare function getVaultConfigById(id: string): VaultConfig | undefined;
export declare function parseVaultId(id: string): {
    region: string;
    denomination: string;
    assetSubtype: string;
};
export declare const INITIAL_NAV = 1000000;
export declare const BPS_DENOMINATOR = 10000;
export declare const USDC_DECIMALS = 6;
export declare const NAV_PRECISION = 1000000;
export declare const PROTOCOL_VERSION = 1;
