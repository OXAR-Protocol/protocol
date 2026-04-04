import { PublicKey } from "@solana/web3.js";
export declare const PROGRAM_ID: PublicKey;
export declare const RPC_URL = "https://api.devnet.solana.com";
export declare const DEFAULT_SERIES = 1;
export interface VaultConfig {
    id: string;
    region: string;
    denomination: string;
    assetSubtype: string;
    series: number;
    apy: number;
    label: string;
    isWar: boolean;
    hasFxRisk: boolean;
}
export declare const VAULT_CONFIGS: VaultConfig[];
export declare function getVaultConfigById(id: string): VaultConfig | undefined;
export declare function parseVaultId(id: string): {
    region: string;
    denomination: string;
    assetSubtype: string;
};
