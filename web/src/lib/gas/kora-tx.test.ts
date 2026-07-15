import { describe, it, expect } from "vitest";
import {
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
  type Connection,
} from "@solana/web3.js";

import { buildKoraLegacyTx, rebuildV0WithKora } from "./kora-tx";

const ATA_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
const BLOCKHASH = "EETubP5AKHgjPAhzPAFcb8BAY1hMH639CWCFTqi3teA1";

const owner = PublicKey.unique();
const kora = PublicKey.unique();
const other = PublicKey.unique();

const key = (pubkey: PublicKey, isSigner = false, isWritable = true) => ({ pubkey, isSigner, isWritable });

describe("buildKoraLegacyTx", () => {
  it("sets Kora as fee payer + the given blockhash, keeps instruction count", () => {
    const tx = new Transaction().add(
      new TransactionInstruction({ programId: other, keys: [key(owner, true)], data: Buffer.from([1, 2]) }),
    );
    const out = buildKoraLegacyTx(tx, owner, kora, BLOCKHASH);
    expect(out.feePayer?.equals(kora)).toBe(true);
    expect(out.recentBlockhash).toBe(BLOCKHASH);
    expect(out.instructions).toHaveLength(1);
  });

  it("reassigns the ATA-create funding slot (owner → Kora) so a 0-SOL user doesn't pay rent", () => {
    const ataIx = new TransactionInstruction({
      programId: ATA_PROGRAM_ID,
      keys: [key(owner, true), key(other)], // slot 0 = funder = owner
      data: Buffer.alloc(0),
    });
    const out = buildKoraLegacyTx(new Transaction().add(ataIx), owner, kora, BLOCKHASH);
    const keys = out.instructions[0].keys;
    expect(keys[0].pubkey.equals(kora)).toBe(true); // funder now Kora
    expect(keys[0].isSigner).toBe(true);
    expect(keys[0].isWritable).toBe(true);
    expect(keys[1].pubkey.equals(other)).toBe(true); // other keys untouched
  });

  it("does NOT touch keys of a non-ATA instruction", () => {
    const ix = new TransactionInstruction({ programId: other, keys: [key(owner, true)], data: Buffer.from([9]) });
    const out = buildKoraLegacyTx(new Transaction().add(ix), owner, kora, BLOCKHASH);
    expect(out.instructions[0].keys[0].pubkey.equals(owner)).toBe(true);
    expect(out.instructions[0].data).toEqual(Buffer.from([9]));
    expect(out.instructions[0].programId.equals(other)).toBe(true);
  });

  it("does NOT reassign an ATA instruction whose funder isn't the owner", () => {
    const ataIx = new TransactionInstruction({ programId: ATA_PROGRAM_ID, keys: [key(other, true)], data: Buffer.alloc(0) });
    const out = buildKoraLegacyTx(new Transaction().add(ataIx), owner, kora, BLOCKHASH);
    expect(out.instructions[0].keys[0].pubkey.equals(other)).toBe(true);
  });

  it("never mutates the input tx (so the native-gas fallback keeps a clean tx)", () => {
    const ix = new TransactionInstruction({ programId: ATA_PROGRAM_ID, keys: [key(owner, true)], data: Buffer.alloc(0) });
    const tx = new Transaction().add(ix);
    buildKoraLegacyTx(tx, owner, kora, BLOCKHASH);
    expect(tx.feePayer).toBeUndefined();
    expect(tx.instructions[0].keys[0].pubkey.equals(owner)).toBe(true); // slot 0 still owner
  });
});

describe("rebuildV0WithKora", () => {
  it("recompiles a v0 tx with Kora as payer + the new blockhash (no lookup tables)", async () => {
    const msg = new TransactionMessage({
      payerKey: owner,
      recentBlockhash: BLOCKHASH,
      instructions: [new TransactionInstruction({ programId: other, keys: [key(owner, true)], data: Buffer.from([7]) })],
    }).compileToV0Message();
    const vtx = new VersionedTransaction(msg);

    // No addressTableLookups → getAddressLookupTable is never called; stub anyway.
    const connection = { getAddressLookupTable: async () => ({ value: null }) } as unknown as Connection;
    const NEW_BLOCKHASH = "9zHE1sZ5c9zL6bJf1oG9nq1s8f9nq1s8f9nq1s8f9nqA";

    const out = await rebuildV0WithKora(vtx, owner, kora, NEW_BLOCKHASH, connection);
    expect(out.message.staticAccountKeys[0].equals(kora)).toBe(true); // payer = first static key
    expect(out.message.recentBlockhash).toBe(NEW_BLOCKHASH);
  });
});
