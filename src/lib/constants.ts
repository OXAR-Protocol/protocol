import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT"
);

export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "http://localhost:8899";

export interface VaultConfig {
  id: string;
  region: string;
  denomination: string;
  assetSubtype: string;
  apy: number;
  label: string;
  isWar: boolean;
  hasFxRisk: boolean;
}

export const VAULT_CONFIGS: VaultConfig[] = [
  {
    id: "UA-UAH-SHORT",
    region: "UA",
    denomination: "UAH",
    assetSubtype: "SHORT",
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
  const [region, denomination, assetSubtype] = id.split("-");
  return { region, denomination, assetSubtype };
}
