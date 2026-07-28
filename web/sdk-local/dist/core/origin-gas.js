"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nativeSymbolFor = nativeSymbolFor;
exports.originGasReserveUsd = originGasReserveUsd;
exports.checkOriginGas = checkOriginGas;
const evm_assets_1 = require("./evm-assets");
const assets_1 = require("./assets");
/** The native coin's ticker for a network. Polygon pays in POL; the rest in ETH. */
function nativeSymbolFor(network) {
    return network === "matic-mainnet" ? "POL" : "ETH";
}
/** What the origin-chain fee is budgeted at, in USD. */
function originGasReserveUsd(network) {
    return assets_1.EVM_GAS_RESERVE_USD[network] ?? assets_1.DEFAULT_EVM_GAS_RESERVE_USD;
}
/**
 * Check the pay-asset against everything the wallet holds.
 *
 * Deliberately NOT a hard block: the reserve figures are per-network heuristics, not
 * a quote for this exact transaction, so refusing on them could lock out someone who
 * has plenty. It reports, and lets the user decide.
 */
function checkOriginGas(payAsset, held) {
    // The Solana leg is relayer-sponsored — a 0-SOL wallet is fine there.
    if (!payAsset || payAsset.chain !== "ethereum")
        return { kind: "ok" };
    const network = payAsset.network ?? "";
    const neededUsd = originGasReserveUsd(network);
    const symbol = nativeSymbolFor(network);
    const native = held.find((a) => a.chain === "ethereum" && a.network === network && a.mint === evm_assets_1.EVM_NATIVE_SENTINEL);
    // Paying with the native coin itself: `spendableBase` holds the fee back, so the
    // only failure left is a balance that is entirely fee. Report the same shortfall.
    const haveUsd = native?.usdValue ?? 0;
    if (!native || haveUsd <= 0)
        return { kind: "missing", network, symbol, neededUsd };
    if (haveUsd < neededUsd)
        return { kind: "low", network, symbol, neededUsd, haveUsd };
    return { kind: "ok" };
}
