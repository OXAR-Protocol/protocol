"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVM_GAS_RESERVE_USD = exports.SOL_SPONSORED_RESERVE = exports.SOL_FEE_RESERVE = exports.SOL_MINT = void 0;
exports.assetUid = assetUid;
exports.spendableBase = spendableBase;
exports.usdToBase = usdToBase;
exports.buildWalletAssets = buildWalletAssets;
const units_1 = require("./units");
const evm_assets_1 = require("./evm-assets");
/** Native SOL wrapped-mint sentinel (used as the asset id for SOL). */
exports.SOL_MINT = "So11111111111111111111111111111111111111112";
/** Stable id unique across chains. Native EVM coins (ETH/POL) share one mint —
 *  the zero sentinel — on every network, so we key on (chain, network, mint).
 *  Used for picker keys and pay-asset selection; keying by mint alone collides
 *  (e.g. ETH on Base vs Arbitrum) and could bridge from the wrong network. */
function assetUid(a) {
    return `${a.chain}:${a.network ?? ""}:${a.mint}`;
}
const DUST_USD = 0.01;
/** Keep this much SOL for tx fees (swap + deposit) when paying with native SOL. */
exports.SOL_FEE_RESERVE = BigInt(10000000); // 0.01 SOL
/** Even when gas is sponsored, swapping NATIVE SOL needs SOL for the temporary
 *  wrapped-SOL account rent (~0.002) — so keep a small reserve rather than zero. */
exports.SOL_SPONSORED_RESERVE = BigInt(5000000); // 0.005 SOL
/** USD of native coin to keep for the ORIGIN-CHAIN network fee when paying with a
 *  native EVM coin (ETH/POL). Without it the bridge tx spends the whole balance and
 *  the wallet rejects it ("insufficient ETH"). Heuristic per network — L1 gas is
 *  dear and volatile, L2s are cheap. (Precise per-tx gas estimation is a follow-up.)
 *  Keys are Alchemy network ids (see bridge/delora `NETWORK_CHAIN_ID`). */
exports.EVM_GAS_RESERVE_USD = {
    "eth-mainnet": 1.5, // Ethereum L1 — expensive, spikes
    "matic-mainnet": 0.05,
    "base-mainnet": 0.1,
    "arb-mainnet": 0.1,
    "opt-mainnet": 0.1,
};
const DEFAULT_EVM_GAS_RESERVE_USD = 0.5;
/** True for a native EVM coin (ETH/POL) — pays its own origin-chain gas. */
function isNativeEvmCoin(asset) {
    return asset.chain === "ethereum" && asset.mint === evm_assets_1.EVM_NATIVE_SENTINEL;
}
/** Base units of an asset that may be spent, leaving gas for the network fee.
 *  - Native SOL: reserve SOL for the tx fee (skipped for Privy-sponsored wallets
 *    via `reserveGas = false`, which keep only the wrapped-SOL rent).
 *  - Native EVM coin (ETH/POL): reserve gas for the origin-chain (bridge) fee —
 *    always, since the EVM origin tx is never sponsored.
 *  - ERC-20 / SPL tokens: pay gas in a separate coin → spend the full balance. */
function spendableBase(asset, reserveGas = true) {
    if (asset.mint === exports.SOL_MINT) {
        // Sponsored (embedded) wallets pay no fee, but a native-SOL swap still needs the
        // small wrapped-SOL rent → keep a reduced reserve; external cover the full fee too.
        const reserve = reserveGas ? exports.SOL_FEE_RESERVE : exports.SOL_SPONSORED_RESERVE;
        const max = asset.amount - reserve;
        return max > BigInt(0) ? max : BigInt(0);
    }
    if (isNativeEvmCoin(asset)) {
        const usd = exports.EVM_GAS_RESERVE_USD[asset.network ?? ""] ?? DEFAULT_EVM_GAS_RESERVE_USD;
        const max = asset.amount - usdToBase(asset, usd);
        return max > BigInt(0) ? max : BigInt(0);
    }
    return asset.amount;
}
/** USD amount → base units of `asset`, at its current unit price (usdValue/uiAmount).
 *  Single source of truth for the USD-denominated money path. */
function usdToBase(asset, usd) {
    const price = asset.usdValue / asset.uiAmount;
    return (0, units_1.toBaseUnits)((usd / price).toFixed(asset.decimals), asset.decimals);
}
/**
 * Build a USD-valued asset list from a Helius DAS result + a Jupiter price map.
 * Includes native SOL (priced by Helius directly), drops dust/zero/unpriced,
 * sorts by USD value desc.
 */
function buildWalletAssets(das, prices) {
    const assets = [];
    const native = das?.nativeBalance;
    if (native?.lamports && native.lamports > 0) {
        const amount = BigInt(native.lamports);
        assets.push({
            mint: exports.SOL_MINT,
            symbol: "SOL",
            decimals: 9,
            amount,
            uiAmount: Number(amount) / 1e9,
            usdValue: native.total_price ?? 0,
            chain: "solana",
        });
    }
    for (const item of das?.items ?? []) {
        if (!item?.interface?.startsWith("Fungible"))
            continue;
        const ti = item.token_info;
        if (!ti?.balance || !ti.decimals)
            continue;
        const amount = BigInt(ti.balance);
        if (amount <= BigInt(0))
            continue;
        const uiAmount = Number(amount) / 10 ** ti.decimals;
        const usdPrice = prices[item.id]?.usdPrice ?? 0;
        assets.push({
            mint: item.id,
            symbol: item.content?.metadata?.symbol || `${item.id.slice(0, 4)}…`,
            decimals: ti.decimals,
            amount,
            uiAmount,
            usdValue: uiAmount * usdPrice,
            chain: "solana",
            logo: item.content?.links?.image,
        });
    }
    return assets
        .filter((a) => a.usdValue >= DUST_USD)
        .sort((a, b) => b.usdValue - a.usdValue);
}
