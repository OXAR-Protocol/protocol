import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "8NsGNHMtfEiJzSczdmN2reo26h75C4axamuLXdk2tfrT"
);

export const RPC_URL = "http://localhost:8899";

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
    id: "UA-UAH-SHORTv2",
    region: "UA",
    denomination: "UAH",
    assetSubtype: "SHORTv2",
    apy: 18,
    label: "Ukraine OVDP UAH (Short-term)",
    isWar: false,
    hasFxRisk: true,
  },
  {
    id: "UA-UAH-MIDv2",
    region: "UA",
    denomination: "UAH",
    assetSubtype: "MIDv2",
    apy: 17,
    label: "Ukraine OVDP UAH (Mid-term)",
    isWar: false,
    hasFxRisk: true,
  },
  {
    id: "UA-USD-STDv2",
    region: "UA",
    denomination: "USD",
    assetSubtype: "STDv2",
    apy: 4,
    label: "Ukraine OVDP USD",
    isWar: false,
    hasFxRisk: false,
  },
  {
    id: "UA-EUR-STDv2",
    region: "UA",
    denomination: "EUR",
    assetSubtype: "STDv2",
    apy: 3.5,
    label: "Ukraine OVDP EUR",
    isWar: false,
    hasFxRisk: true,
  },
  {
    id: "UA-UAH-WARv2",
    region: "UA",
    denomination: "UAH",
    assetSubtype: "WARv2",
    apy: 18,
    label: "Ukraine War Bonds UAH",
    isWar: true,
    hasFxRisk: true,
  },
  {
    id: "UA-USD-WARv2",
    region: "UA",
    denomination: "USD",
    assetSubtype: "WARv2",
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
