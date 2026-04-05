"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROTOCOL_VERSION = exports.NAV_PRECISION = exports.USDC_DECIMALS = exports.BPS_DENOMINATOR = exports.INITIAL_NAV = exports.VAULT_CONFIGS = exports.DEFAULT_SERIES = exports.RPC_URL = exports.PROGRAM_ID = void 0;
exports.getVaultConfigById = getVaultConfigById;
exports.parseVaultId = parseVaultId;
const web3_js_1 = require("@solana/web3.js");
exports.PROGRAM_ID = new web3_js_1.PublicKey("8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT");
exports.RPC_URL = "https://api.devnet.solana.com";
exports.DEFAULT_SERIES = 1;
exports.VAULT_CONFIGS = [
    {
        id: "UA-UAH-SHORT",
        region: "UA",
        denomination: "UAH",
        assetSubtype: "SHORT",
        series: 1,
        apy: 18,
        label: "Ukraine OVDP UAH (Short-term)",
        isWar: false,
        hasFxRisk: true,
    },
    {
        id: "UA-UAH-MID",
        region: "UA",
        denomination: "UAH",
        assetSubtype: "MID",
        series: 1,
        apy: 17,
        label: "Ukraine OVDP UAH (Mid-term)",
        isWar: false,
        hasFxRisk: true,
    },
    {
        id: "UA-USD-STD",
        region: "UA",
        denomination: "USD",
        assetSubtype: "STD",
        series: 1,
        apy: 4,
        label: "Ukraine OVDP USD",
        isWar: false,
        hasFxRisk: false,
    },
    {
        id: "UA-EUR-STD",
        region: "UA",
        denomination: "EUR",
        assetSubtype: "STD",
        series: 1,
        apy: 3.5,
        label: "Ukraine OVDP EUR",
        isWar: false,
        hasFxRisk: true,
    },
    {
        id: "UA-UAH-WAR",
        region: "UA",
        denomination: "UAH",
        assetSubtype: "WAR",
        series: 1,
        apy: 18,
        label: "Ukraine War Bonds UAH",
        isWar: true,
        hasFxRisk: true,
    },
    {
        id: "UA-USD-WAR",
        region: "UA",
        denomination: "USD",
        assetSubtype: "WAR",
        series: 1,
        apy: 4,
        label: "Ukraine War Bonds USD",
        isWar: true,
        hasFxRisk: false,
    },
];
function getVaultConfigById(id) {
    return exports.VAULT_CONFIGS.find((v) => v.id === id);
}
function parseVaultId(id) {
    const parts = id.split("-");
    if (parts.length !== 3)
        throw new Error(`Invalid vault ID: ${id}`);
    return { region: parts[0], denomination: parts[1], assetSubtype: parts[2] };
}
exports.INITIAL_NAV = 1000000;
exports.BPS_DENOMINATOR = 10000;
exports.USDC_DECIMALS = 6;
exports.NAV_PRECISION = 1000000;
exports.PROTOCOL_VERSION = 1;
