"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildKoraLegacyTx = buildKoraLegacyTx;
exports.rebuildV0WithKora = rebuildV0WithKora;
const web3_js_1 = require("@solana/web3.js");
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
function withKoraAtaRent(ix, ownerPk, koraPk) {
    const keys = ix.keys.map((k) => ({ ...k }));
    if (ix.programId.toBase58() === ATA_PROGRAM_ID && keys[0]?.pubkey.equals(ownerPk)) {
        keys[0] = { pubkey: koraPk, isSigner: true, isWritable: true };
    }
    return keys;
}
/** Legacy tx → a copy with Kora as fee payer. */
function buildKoraLegacyTx(tx, ownerPk, koraPk, blockhash) {
    const koraTx = new web3_js_1.Transaction();
    koraTx.feePayer = koraPk;
    koraTx.recentBlockhash = blockhash;
    for (const ix of tx.instructions) {
        koraTx.add(new web3_js_1.TransactionInstruction({
            keys: withKoraAtaRent(ix, ownerPk, koraPk),
            programId: ix.programId,
            data: ix.data,
        }));
    }
    return koraTx;
}
/** v0 tx → a recompiled v0 with Kora as fee payer (lookup tables preserved). */
async function rebuildV0WithKora(vtx, ownerPk, koraPk, blockhash, connection) {
    const msg = vtx.message;
    const alts = [];
    for (const lookup of msg.addressTableLookups) {
        const res = await connection.getAddressLookupTable(lookup.accountKey);
        if (res.value)
            alts.push(res.value);
    }
    const decompiled = web3_js_1.TransactionMessage.decompile(msg, { addressLookupTableAccounts: alts });
    const instructions = decompiled.instructions.map((ix) => new web3_js_1.TransactionInstruction({
        keys: withKoraAtaRent(ix, ownerPk, koraPk),
        programId: ix.programId,
        data: ix.data,
    }));
    const newMsg = new web3_js_1.TransactionMessage({
        payerKey: koraPk,
        recentBlockhash: blockhash,
        instructions,
    }).compileToV0Message(alts);
    return new web3_js_1.VersionedTransaction(newMsg);
}
