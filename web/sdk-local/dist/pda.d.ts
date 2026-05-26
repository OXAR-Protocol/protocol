import { PublicKey } from "@solana/web3.js";
export declare function derivePersonalVaultPda(creator: PublicKey, vaultId: bigint): [PublicKey, number];
export declare function deriveGroupVaultPda(creator: PublicKey, vaultId: bigint): [PublicKey, number];
export declare function deriveGroupMemberPda(groupVault: PublicKey, member: PublicKey): [PublicKey, number];
export declare function deriveRulePda(owner: PublicKey, ruleId: bigint): [PublicKey, number];
export declare function deriveMintPda(vault: PublicKey): [PublicKey, number];
export declare function derivePoolPda(vault: PublicKey): [PublicKey, number];
