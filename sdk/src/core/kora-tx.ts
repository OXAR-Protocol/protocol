import {
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
  Connection,
  AddressLookupTableAccount,
} from "@solana/web3.js";

/**
 * Transaction transforms for the Kora gasless path: make Kora the fee payer without
 * changing what the transaction does. Two shapes:
 *  - legacy `Transaction` (our Jupiter Lend deposits/withdraws) — copy the instructions
 *    under a Kora fee payer.
 *  - v0 `VersionedTransaction` (Kamino, Jupiter swaps for stocks/gold) — decompile with
 *    its lookup tables, then recompile with Kora as payer.
 * Both also reassign ATA-creation rent to Kora so a 0-SOL user isn't the funding account.
 * Inputs are never mutated, so a failed Kora attempt can fall back to the original tx.
 *
 * Framework-agnostic (no React/Next/DOM) — shared by web + future mobile.
 */

const ATA_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

/** Fresh keys array with the ATA-create funding slot (index 0) moved owner → Kora. */
function withKoraAtaRent(
  ix: TransactionInstruction,
  ownerPk: PublicKey,
  koraPk: PublicKey,
): TransactionInstruction["keys"] {
  const keys = ix.keys.map((k) => ({ ...k }));
  if (ix.programId.toBase58() === ATA_PROGRAM_ID && keys[0]?.pubkey.equals(ownerPk)) {
    keys[0] = { pubkey: koraPk, isSigner: true, isWritable: true };
  }
  return keys;
}

/** Legacy tx → a copy with Kora as fee payer. */
export function buildKoraLegacyTx(
  tx: Transaction,
  ownerPk: PublicKey,
  koraPk: PublicKey,
  blockhash: string,
): Transaction {
  const koraTx = new Transaction();
  koraTx.feePayer = koraPk;
  koraTx.recentBlockhash = blockhash;
  for (const ix of tx.instructions) {
    koraTx.add(
      new TransactionInstruction({
        keys: withKoraAtaRent(ix, ownerPk, koraPk),
        programId: ix.programId,
        data: ix.data,
      }),
    );
  }
  return koraTx;
}

/** v0 tx → a recompiled v0 with Kora as fee payer (lookup tables preserved). */
export async function rebuildV0WithKora(
  vtx: VersionedTransaction,
  ownerPk: PublicKey,
  koraPk: PublicKey,
  blockhash: string,
  connection: Connection,
): Promise<VersionedTransaction> {
  const msg = vtx.message;

  const alts: AddressLookupTableAccount[] = [];
  for (const lookup of msg.addressTableLookups) {
    const res = await connection.getAddressLookupTable(lookup.accountKey);
    if (res.value) alts.push(res.value);
  }

  const decompiled = TransactionMessage.decompile(msg, { addressLookupTableAccounts: alts });
  const instructions = decompiled.instructions.map(
    (ix) =>
      new TransactionInstruction({
        keys: withKoraAtaRent(ix, ownerPk, koraPk),
        programId: ix.programId,
        data: ix.data,
      }),
  );

  const newMsg = new TransactionMessage({
    payerKey: koraPk,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message(alts);

  return new VersionedTransaction(newMsg);
}
