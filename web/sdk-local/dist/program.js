"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOxarProgram = createOxarProgram;
const anchor_1 = require("@coral-xyz/anchor");
const web3_js_1 = require("@solana/web3.js");
const idl_json_1 = __importDefault(require("./idl.json"));
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
 * @param wallet - Optional wallet. If omitted, a read-only dummy wallet is
 *   used (sufficient for fetching accounts).
 */
function createOxarProgram(connection, wallet) {
    const w = wallet ?? createReadOnlyWallet();
    const provider = new anchor_1.AnchorProvider(connection, w, {
        commitment: "confirmed",
    });
    // SAFETY: Anchor 0.31 reads IDL from JSON; type is validated by OxarProtocol
    return new anchor_1.Program(idl_json_1.default, provider);
}
