"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.APY_BUCKETS = exports.YIELD_SOURCES = exports.USDC_DECIMALS = exports.NAV_PRECISION = exports.INITIAL_NAV = exports.RPC_URL = exports.PROGRAM_ID = void 0;
exports.getYieldSourceById = getYieldSourceById;
exports.vaultIdForYieldSource = vaultIdForYieldSource;
const web3_js_1 = require("@solana/web3.js");
// ============================================================================
// Program
// ============================================================================
exports.PROGRAM_ID = new web3_js_1.PublicKey("8RCVjQJhfcRYVpAM8v4jhvvbhjfkdqFwPtffEKNcBQwJ");
exports.RPC_URL = "https://api.devnet.solana.com";
// ============================================================================
// Math constants (mirror of contracts/.../constants.rs)
// ============================================================================
exports.INITIAL_NAV = 1000000;
exports.NAV_PRECISION = 1000000;
exports.USDC_DECIMALS = 6;
exports.YIELD_SOURCES = [
    {
        id: "ukraine-gov-bonds",
        name: "Ukrainian Gov Bonds",
        description: "Tokenized Ukrainian government bonds (OVDP) — sovereign-backed, USD & UAH terms.",
        chain: "solana",
        baseApy: 16,
        apyLabel: "4–16%",
        riskLevel: "low",
        viaDelora: false,
        available: false,
    },
];
exports.APY_BUCKETS = [
    {
        id: "sleepy",
        label: "Sleepy",
        emoji: "😴",
        description: "low APY · low risk",
        matches: (apy) => apy < 6,
    },
    {
        id: "walking",
        label: "Walking",
        emoji: "🚶",
        description: "balanced APY",
        matches: (apy) => apy >= 6 && apy < 9,
    },
    {
        id: "running",
        label: "Running",
        emoji: "🏃",
        description: "high APY · loud risk",
        matches: (apy) => apy >= 9,
    },
];
function getYieldSourceById(id) {
    return exports.YIELD_SOURCES.find((s) => s.id === id);
}
/** Stable vault_id derived from yield-source id. Used for vault PDA. */
function vaultIdForYieldSource(yieldSourceId) {
    let hash = 5381n;
    for (let i = 0; i < yieldSourceId.length; i++) {
        hash = ((hash << 5n) + hash + BigInt(yieldSourceId.charCodeAt(i))) & 0xffffffffffffffffn;
    }
    return hash;
}
