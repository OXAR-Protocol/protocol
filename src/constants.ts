import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT"
);

export const RPC_URL = "https://api.devnet.solana.com";

export const DEFAULT_SERIES = 2;

export interface VaultConfig {
  readonly id: string;
  readonly region: string;
  readonly denomination: string;
  readonly assetSubtype: string;
  readonly series: number;
  readonly apy: number;
  readonly label: string;
  readonly isWar: boolean;
  readonly hasFxRisk: boolean;
}

export const VAULT_CONFIGS: readonly VaultConfig[] = [
  {
    id: "UA-UAH-SHORT",
    region: "UA",
    denomination: "UAH",
    assetSubtype: "SHORT",
    series: 2,
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
    series: 2,
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
    series: 2,
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
    series: 2,
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
    series: 2,
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
    series: 2,
    apy: 4,
    label: "Ukraine War Bonds USD",
    isWar: true,
    hasFxRisk: false,
  },
];

export function getVaultConfigById(id: string): VaultConfig | undefined {
  return VAULT_CONFIGS.find((v) => v.id === id);
}

export function parseVaultId(id: string): {
  region: string;
  denomination: string;
  assetSubtype: string;
} {
  const parts = id.split("-");
  if (parts.length !== 3) throw new Error(`Invalid vault ID: ${id}`);
  return { region: parts[0], denomination: parts[1], assetSubtype: parts[2] };
}

export const INITIAL_NAV = 1_000_000;
export const BPS_DENOMINATOR = 10_000;
export const USDC_DECIMALS = 6;
export const NAV_PRECISION = 1_000_000;
export const PROTOCOL_VERSION = 1;
