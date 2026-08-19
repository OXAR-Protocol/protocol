import { describe, it, expect, afterEach } from "vitest";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

import { injectedBatchSign } from "./injected-batch";

const owner = Keypair.generate();
const payer = Keypair.generate();
const BLOCKHASH = "11111111111111111111111111111111";

/** A legacy transfer whose fee payer is somebody else — the gasless shape. */
function legacyTx(): Transaction {
  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: owner.publicKey,
      toPubkey: new PublicKey(BLOCKHASH),
      lamports: 1,
    }),
  );
  tx.recentBlockhash = BLOCKHASH;
  tx.feePayer = payer.publicKey;
  return tx;
}

function v0Tx(): VersionedTransaction {
  const message = new TransactionMessage({
    payerKey: payer.publicKey,
    recentBlockhash: BLOCKHASH,
    instructions: [
      SystemProgram.transfer({
        fromPubkey: owner.publicKey,
        toPubkey: new PublicKey(BLOCKHASH),
        lamports: 1,
      }),
    ],
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

function stubWallet(provider: unknown) {
  (globalThis as { window?: unknown }).window = { phantom: { solana: provider } };
}

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("injectedBatchSign", () => {
  it("is absent when no wallet is injected", () => {
    (globalThis as { window?: unknown }).window = {};
    expect(injectedBatchSign(owner.publicKey.toBase58())).toBeNull();
  });

  it("is absent when the injected wallet is on another account", () => {
    stubWallet({ publicKey: payer.publicKey, signAllTransactions: async () => [] });
    expect(injectedBatchSign(owner.publicKey.toBase58())).toBeNull();
  });

  it("hands the wallet every transaction at once, legacy and v0 alike", async () => {
    let seen: unknown[] = [];
    stubWallet({
      publicKey: owner.publicKey,
      signAllTransactions: async (txs: unknown[]) => {
        seen = txs;
        return txs;
      },
    });

    const batch = injectedBatchSign(owner.publicKey.toBase58());
    expect(batch).not.toBeNull();

    const wire = [
      legacyTx().serialize({ requireAllSignatures: false, verifySignatures: false }),
      v0Tx().serialize(),
    ];
    const out = await batch!(wire);

    // One call, both transactions — that IS the fix: two prompts became one.
    expect(seen).toHaveLength(2);
    expect(seen[0]).toBeInstanceOf(Transaction);
    expect(seen[1]).toBeInstanceOf(VersionedTransaction);
    expect(out).toHaveLength(2);
  });

  it("refuses a wallet that gives back a different number of transactions", async () => {
    stubWallet({
      publicKey: owner.publicKey,
      signAllTransactions: async (txs: unknown[]) => txs.slice(1),
    });
    const batch = injectedBatchSign(owner.publicKey.toBase58())!;
    await expect(
      batch([
        legacyTx().serialize({ requireAllSignatures: false, verifySignatures: false }),
        v0Tx().serialize(),
      ]),
    ).rejects.toThrow(/different number/);
  });
});
