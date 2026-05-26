"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.derivePersonalVaultPda = derivePersonalVaultPda;
exports.deriveGroupVaultPda = deriveGroupVaultPda;
exports.deriveGroupMemberPda = deriveGroupMemberPda;
exports.deriveRulePda = deriveRulePda;
exports.deriveMintPda = deriveMintPda;
exports.derivePoolPda = derivePoolPda;
const web3_js_1 = require("@solana/web3.js");
const constants_1 = require("./constants");
// ============================================================================
// Vault PDAs (personal and group are different seeds)
// ============================================================================
/// Personal vault: ["vault", creator, vault_id_le_bytes]
function derivePersonalVaultPda(creator, vaultId) {
    const vaultIdBytes = bigintToLeBytes(vaultId, 8);
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("vault"), creator.toBuffer(), vaultIdBytes], constants_1.PROGRAM_ID);
}
/// Group vault: ["group", creator, vault_id_le_bytes]
function deriveGroupVaultPda(creator, vaultId) {
    const vaultIdBytes = bigintToLeBytes(vaultId, 8);
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("group"), creator.toBuffer(), vaultIdBytes], constants_1.PROGRAM_ID);
}
/// Group member: ["member", group_vault, member_pubkey]
function deriveGroupMemberPda(groupVault, member) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("member"), groupVault.toBuffer(), member.toBuffer()], constants_1.PROGRAM_ID);
}
/// Rule: ["rule", owner, rule_id_le_bytes]
function deriveRulePda(owner, ruleId) {
    const ruleIdBytes = bigintToLeBytes(ruleId, 8);
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("rule"), owner.toBuffer(), ruleIdBytes], constants_1.PROGRAM_ID);
}
// ============================================================================
// Vault sub-account PDAs (shared between personal and group)
// ============================================================================
/// Share token mint: ["mint", vault]
function deriveMintPda(vault) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("mint"), vault.toBuffer()], constants_1.PROGRAM_ID);
}
/// Hot USDC pool: ["pool", vault]
function derivePoolPda(vault) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("pool"), vault.toBuffer()], constants_1.PROGRAM_ID);
}
// ============================================================================
// Helpers
// ============================================================================
function bigintToLeBytes(value, byteLength) {
    const buf = Buffer.alloc(byteLength);
    let v = value;
    for (let i = 0; i < byteLength; i++) {
        buf[i] = Number(v & 0xffn);
        v >>= 8n;
    }
    return buf;
}
