"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOxarProgram = createOxarProgram;
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const types_1 = require("./types");
/**
 * Create a read-only dummy wallet for use when no wallet is provided.
 * This allows fetching on-chain account data without signing.
 */
function createReadOnlyWallet() {
    const keypair = web3_js_1.Keypair.generate();
    return {
        publicKey: keypair.publicKey,
        // SAFETY: Read-only wallet stubs; signatures are never used
        signTransaction: async (tx) => tx,
        signAllTransactions: async (txs) => txs,
        payer: keypair,
    };
}
/**
 * Create an Anchor Program instance for the OXAR protocol.
 *
 * @param connection - Solana RPC connection
 * @param wallet - Optional wallet (Anchor Wallet interface). If omitted, a
 *   read-only dummy wallet is used (sufficient for fetching accounts).
 * @returns Program<OxarProtocol>
 */
function createOxarProgram(connection, wallet) {
    const w = wallet ?? createReadOnlyWallet();
    const provider = new anchor_1.AnchorProvider(connection, w, {
        commitment: "confirmed",
    });
    // SAFETY: IDL JSON import needs cast; type is validated by OxarProtocol definition
    return new anchor_1.Program(types_1.IDL, provider);
}
