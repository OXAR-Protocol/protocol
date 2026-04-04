import { PublicKey } from "@solana/web3.js";
export declare function deriveVaultPda(region: string, denomination: string, assetSubtype: string, series?: number): [PublicKey, number];
export declare function deriveMintPda(vaultPubkey: PublicKey): [PublicKey, number];
export declare function derivePoolPda(vaultPubkey: PublicKey): [PublicKey, number];
export declare function deriveListingPda(vaultPubkey: PublicKey, sellerPubkey: PublicKey): [PublicKey, number];
export declare function deriveEscrowPda(vaultPubkey: PublicKey, sellerPubkey: PublicKey): [PublicKey, number];
