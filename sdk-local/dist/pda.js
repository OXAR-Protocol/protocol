"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveVaultPda = deriveVaultPda;
exports.deriveMintPda = deriveMintPda;
exports.derivePoolPda = derivePoolPda;
exports.deriveListingPda = deriveListingPda;
exports.deriveEscrowPda = deriveEscrowPda;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
function deriveVaultPda(region, denomination, assetSubtype, series = constants_1.DEFAULT_SERIES) {
    const seriesBytes = Buffer.alloc(2);
    seriesBytes.writeUInt16LE(series);
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from("vault"),
        Buffer.from(region),
        Buffer.from(denomination),
        Buffer.from(assetSubtype),
        seriesBytes,
    ], constants_1.PROGRAM_ID);
}
function deriveMintPda(vaultPubkey) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("mint"), vaultPubkey.toBuffer()], constants_1.PROGRAM_ID);
}
function derivePoolPda(vaultPubkey) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("pool"), vaultPubkey.toBuffer()], constants_1.PROGRAM_ID);
}
function deriveListingPda(vaultPubkey, sellerPubkey) {
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from("listing"),
        vaultPubkey.toBuffer(),
        sellerPubkey.toBuffer(),
    ], constants_1.PROGRAM_ID);
}
function deriveEscrowPda(vaultPubkey, sellerPubkey) {
    return web3_js_1.PublicKey.findProgramAddressSync([
        Buffer.from("escrow"),
        vaultPubkey.toBuffer(),
        sellerPubkey.toBuffer(),
    ], constants_1.PROGRAM_ID);
}
