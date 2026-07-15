import { Transaction, VersionedTransaction, PublicKey, Connection } from "@solana/web3.js";
/** Legacy tx → a copy with Kora as fee payer. */
export declare function buildKoraLegacyTx(tx: Transaction, ownerPk: PublicKey, koraPk: PublicKey, blockhash: string): Transaction;
/** v0 tx → a recompiled v0 with Kora as fee payer (lookup tables preserved). */
export declare function rebuildV0WithKora(vtx: VersionedTransaction, ownerPk: PublicKey, koraPk: PublicKey, blockhash: string, connection: Connection): Promise<VersionedTransaction>;
