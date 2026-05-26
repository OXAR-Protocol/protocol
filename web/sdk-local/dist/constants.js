"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RISK_TEMPLATES = exports.YIELD_SOURCES = exports.USDC_DECIMALS = exports.NAV_PRECISION = exports.INITIAL_NAV = exports.RPC_URL = exports.PROGRAM_ID = void 0;
exports.getYieldSourceById = getYieldSourceById;
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
        id: "kamino-usdc",
        name: "Kamino USDC",
        description: "USDC lending on Solana",
        chain: "solana",
        baseApy: 5.5,
        riskLevel: "low",
        viaDelora: false,
        available: false, // wired up in Phase D
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
        id: "ondo-usdy",
        name: "Ondo USDY",
        description: "Tokenized US Treasuries (cross-chain via Delora)",
        chain: "ethereum",
        baseApy: 5.0,
        riskLevel: "low",
        viaDelora: true,
        available: false,
    },
    {
        id: "ethena-susde",
        name: "Ethena sUSDe",
        description: "DeFi stablecoin yield (cross-chain via Delora)",
        chain: "ethereum",
        baseApy: 11.0,
        riskLevel: "high",
        viaDelora: true,
        available: false,
    },
    {
        id: "sky-sdai",
        name: "Sky sDAI",
        description: "Sky savings rate (cross-chain via Delora)",
        chain: "ethereum",
        baseApy: 6.5,
        riskLevel: "low",
        viaDelora: true,
        available: false,
    },
];
exports.RISK_TEMPLATES = {
    conservative: {
        label: "Sleepy",
        emoji: "😴",
        description: "Slow but steady",
        targetApy: 5,
        sources: ["kamino-usdc", "ondo-usdy"],
    },
    balanced: {
        label: "Walking",
        emoji: "🚶",
        description: "Balanced pace",
        targetApy: 7,
        sources: ["kamino-usdc", "maple-solana", "jlp"],
    },
    aggressive: {
        label: "Running",
        emoji: "🏃",
        description: "Fast & loud",
        targetApy: 10,
        sources: ["jlp", "ethena-susde"],
    },
};
function getYieldSourceById(id) {
    return exports.YIELD_SOURCES.find((s) => s.id === id);
}
