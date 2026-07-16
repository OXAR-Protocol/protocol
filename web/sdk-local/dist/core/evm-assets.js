"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVM_NATIVE_SENTINEL = void 0;
exports.networkLabel = networkLabel;
exports.assetNetworkLabel = assetNetworkLabel;
exports.buildEvmAssets = buildEvmAssets;
const units_1 = require("./units");
/** Address representing a native EVM coin (ETH/POL/…). The zero address is the
 * canonical native representation Delora expects as `originCurrency`. */
exports.EVM_NATIVE_SENTINEL = "0x0000000000000000000000000000000000000000";
const DUST_USD = 0.01;
/** Native coin symbol per Alchemy network — the API returns null metadata for it. */
const NATIVE_SYMBOL = {
    "eth-mainnet": "ETH",
    "base-mainnet": "ETH",
    "arb-mainnet": "ETH",
    "opt-mainnet": "ETH",
    "matic-mainnet": "POL",
};
/** Human-readable network name from an Alchemy network id (for the pay picker). */
const NETWORK_LABEL = {
    "eth-mainnet": "Ethereum",
    "base-mainnet": "Base",
    "arb-mainnet": "Arbitrum",
    "opt-mainnet": "Optimism",
    "matic-mainnet": "Polygon",
};
/** Display name of an EVM network, or null (Solana / unknown). */
function networkLabel(network) {
    return network ? NETWORK_LABEL[network] ?? null : null;
}
/** Network name for ANY asset — "Solana" for Solana holdings, else the EVM
 *  network. Every pay-asset shows its chain so nothing is ambiguous. */
function assetNetworkLabel(a) {
    if (a.chain === "solana")
        return "Solana";
    return networkLabel(a.network) ?? "Ethereum";
}
/** Balance → base units. Handles both hex ("0x..", already base units) and
 * decimal UI strings ("100.5", scaled by decimals). */
function toBase(raw, decimals) {
    if (raw.startsWith("0x"))
        return BigInt(raw);
    return (0, units_1.toBaseUnits)(raw, decimals);
}
/**
 * Build a USD-valued, chain-tagged asset list from Alchemy's multi-network token
 * response. Drops errored / zero / dust / unpriced tokens; sorts by USD value desc.
 */
function buildEvmAssets(tokens) {
    const assets = [];
    for (const t of tokens) {
        if (t.error)
            continue;
        if (!t.tokenBalance)
            continue;
        const isNative = t.tokenAddress === null;
        // Native coin comes back with null metadata — default to 18 decimals.
        const decimals = t.tokenMetadata?.decimals ?? (isNative ? 18 : undefined);
        if (typeof decimals !== "number")
            continue;
        let amount;
        try {
            amount = toBase(t.tokenBalance, decimals);
        }
        catch {
            continue;
        }
        if (amount <= BigInt(0))
            continue;
        const price = Number(t.tokenPrices?.find((p) => p.currency === "usd")?.value ?? 0);
        if (!(price > 0))
            continue;
        const uiAmount = Number(amount) / 10 ** decimals;
        assets.push({
            mint: isNative ? exports.EVM_NATIVE_SENTINEL : t.tokenAddress,
            symbol: t.tokenMetadata?.symbol || (isNative ? NATIVE_SYMBOL[t.network] ?? "ETH" : "TOKEN"),
            decimals,
            amount,
            uiAmount,
            usdValue: uiAmount * price,
            chain: "ethereum",
            network: t.network,
            logo: t.tokenMetadata?.logo,
        });
    }
    return assets.filter((a) => a.usdValue >= DUST_USD).sort((a, b) => b.usdValue - a.usdValue);
}
