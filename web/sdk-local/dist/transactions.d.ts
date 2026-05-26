import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import { OxarProtocol } from "./types";
/**
 * Build initialize_personal_vault transaction.
 *
 * Creates a new vault PDA scoped to the creator + vault_id. Anyone can create —
 * no admin gate. The vault is inactive until `setup_vault_pool` runs.
 */
export declare function buildInitializePersonalVaultTransaction(program: Program<OxarProtocol>, connection: Connection, creator: PublicKey, usdcMint: PublicKey, vaultId: bigint, params: {
    riskTemplate: {
        conservative?: {};
    } | {
        balanced?: {};
    } | {
        aggressive?: {};
    };
    yieldSource: any;
    feeBps: number;
}): Promise<Transaction>;
/**
 * Build deposit transaction — works for personal and group vaults.
 *
 * Creates the depositor's vault-token ATA if it does not already exist.
 */
export declare function buildDepositTransaction(program: Program<OxarProtocol>, connection: Connection, depositor: PublicKey, vaultPda: PublicKey, amount: BN): Promise<Transaction>;
/**
 * Build withdraw transaction. Burns shares, transfers USDC from hot pool.
 *
 * No maturity check — vaults are perpetual, withdraw anytime.
 */
export declare function buildWithdrawTransaction(program: Program<OxarProtocol>, connection: Connection, withdrawer: PublicKey, vaultPda: PublicKey, shares: BN): Promise<Transaction>;
/**
 * Build crank_nav transaction — permissionless NAV update.
 */
export declare function buildCrankNavTransaction(program: Program<OxarProtocol>, connection: Connection, cranker: PublicKey, vaultPda: PublicKey): Promise<Transaction>;
