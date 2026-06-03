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
    // Foundation — Solana-native
    {
        id: "kamino-usdc",
        name: "Kamino USDC",
        description: "USDC lending on Solana",
        chain: "solana",
        baseApy: 5.5,
        riskLevel: "low",
        viaDelora: false,
        available: false,
    },
    {
        id: "marginfi-usdc",
        name: "MarginFi USDC",
        description: "USDC lending alternative to Kamino",
        chain: "solana",
        baseApy: 4.5,
        riskLevel: "low",
        viaDelora: false,
        available: false,
    },
    {
        id: "jlp",
        name: "Jupiter LP",
        description: "Jupiter Perps liquidity provider token",
        chain: "solana",
        baseApy: 9.5,
        riskLevel: "medium",
        viaDelora: false,
        available: false,
    },
    {
        id: "maple-solana",
        name: "Maple Syrup USDC",
        description: "Institutional credit on Solana",
        chain: "solana",
        baseApy: 7.5,
        riskLevel: "medium",
        viaDelora: false,
        available: false,
    },
    {
        id: "drift-insurance",
        name: "Drift Insurance Fund",
        description: "Backstop liquidity for Drift Perps",
        chain: "solana",
        baseApy: 10.0,
        riskLevel: "medium",
        viaDelora: false,
        available: false,
    },
    // RWA Treasuries — облигации США через Delora cross-chain
    // (Ondo USDY is now LIVE natively on Solana — see web yield provider
    //  `lib/yield/ondo.ts`; it lists under "Live now", not the roadmap.)
    {
        id: "mountain-usdm",
        name: "Mountain USDM",
        description: "Retail-regulated US Treasuries (Bermuda)",
        chain: "ethereum",
        baseApy: 5.0,
        riskLevel: "low",
        viaDelora: true,
        available: false,
    },
    {
        id: "openeden-tbill",
        name: "OpenEden TBILL",
        description: "Institutional T-Bills with daily NAV",
        chain: "ethereum",
        baseApy: 5.2,
        riskLevel: "low",
        viaDelora: true,
        available: false,
    },
    // Stable / advanced DeFi yields
    {
        id: "sky-sdai",
        name: "Sky sDAI",
        description: "Sky (formerly Maker) savings rate",
        chain: "ethereum",
        baseApy: 6.5,
        riskLevel: "low",
        viaDelora: true,
        available: false,
    },
    {
        id: "ethena-susde",
        name: "Ethena sUSDe",
        description: "Delta-neutral stablecoin yield (advanced)",
        chain: "ethereum",
        baseApy: 11.0,
        riskLevel: "high",
        viaDelora: true,
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
