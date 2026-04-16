import type { VaultConfig } from "@oxar/sdk";

export function getBondName(config: VaultConfig): string {
  if (config.isWar) return "War Bond";
  if (config.assetSubtype === "SHORT") return "OVDP Short-term";
  if (config.assetSubtype === "MID") return "OVDP Mid-term";
  return "OVDP Standard";
}

export function getBondTerm(config: VaultConfig): string {
  if (config.assetSubtype === "SHORT") return "3-12 months";
  if (config.assetSubtype === "MID") return "1-3 years";
  if (config.isWar) return "1-2 years";
  return "Stable";
}

export function getBondTermShort(config: VaultConfig): string {
  if (config.assetSubtype === "SHORT") return "3-12mo";
  if (config.assetSubtype === "MID") return "1-3yr";
  if (config.isWar) return "1-2yr";
  return "Stable";
}

export function getRegionLabel(region: string): string {
  if (region === "UA") return "Ukraine";
  return region;
}

export function getBondIssuer(config: VaultConfig): string {
  if (config.region === "UA") return "Ministry of Finance of Ukraine";
  return `${getRegionLabel(config.region)} Treasury`;
}
