import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { Program, BN } from "@coral-xyz/anchor";
import { OxarProtocol } from "./types";
/**
 * Build an unsigned deposit transaction.
 *
 * Derives all needed PDAs, creates the depositor's vault-token ATA if it does
 * not already exist, and assembles the transaction with a recent blockhash.
 */
export declare function buildDepositTransaction(program: Program<OxarProtocol>, connection: Connection, depositor: PublicKey, vaultPda: PublicKey, amount: BN): Promise<Transaction>;
/**
 * Build an unsigned create-listing transaction.
 *
 * Derives listing and escrow PDAs, looks up the seller's vault-token ATA, and
 * assembles the instruction.
 */
export declare function buildCreateListingTransaction(program: Program<OxarProtocol>, connection: Connection, seller: PublicKey, vaultPda: PublicKey, amount: BN, pricePerToken: BN): Promise<Transaction>;
/**
 * Build an unsigned buy-listing transaction.
 *
 * Fetches vault data to determine the USDC mint, derives all PDAs, creates the
 * buyer's vault-token ATA if needed, and assembles the instruction.
 */
export declare function buildBuyListingTransaction(program: Program<OxarProtocol>, connection: Connection, buyer: PublicKey, vaultPda: PublicKey, sellerPubkey: PublicKey): Promise<Transaction>;
/**
 * Build an unsigned cancel-listing transaction.
 *
 * Derives listing and escrow PDAs, looks up the seller's vault-token ATA, and
 * assembles the instruction.
 */
export declare function buildCancelListingTransaction(program: Program<OxarProtocol>, connection: Connection, seller: PublicKey, vaultPda: PublicKey): Promise<Transaction>;
/**
 * Build an unsigned transfer-tokens transaction.
 *
 * Sends vault tokens from the sender wallet to a recipient wallet. Sender pays
 * the rent for the recipient's vault-token ATA if it doesn't exist yet.
 */
export declare function buildTransferTokensTransaction(program: Program<OxarProtocol>, connection: Connection, sender: PublicKey, recipient: PublicKey, vaultPda: PublicKey, amount: BN): Promise<Transaction>;
/**
 * Build an unsigned claim transaction.
 *
 * Fetches vault data to determine the USDC mint, derives mint and pool PDAs,
 * looks up the claimer's token ATAs, and assembles the instruction.
 */
export declare function buildClaimTransaction(program: Program<OxarProtocol>, connection: Connection, claimer: PublicKey, vaultPda: PublicKey): Promise<Transaction>;
