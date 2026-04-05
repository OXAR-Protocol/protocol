import { BN } from "@coral-xyz/anchor";

export function formatUsdc(amount: BN): string {
  const val = amount.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
}

export function formatNav(navPerShare: BN): string {
  const val = navPerShare.toNumber() / 1_000_000;
  return `$${val.toFixed(6)}`;
}

export function formatApy(apyBps: BN): string {
  const val = apyBps.toNumber() / 100;
  return `${val.toFixed(1)}%`;
}

export function formatTokens(amount: BN): string {
  const val = amount.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(val);
}

export function formatShares(shares: BN): string {
  const val = shares.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(val);
}

export function getMaturityCountdown(maturityTs: BN): { text: string; matured: boolean } {
  const now = Date.now() / 1000;
  const maturity = maturityTs.toNumber();
  const diff = maturity - now;

  if (diff <= 0) return { text: "Matured", matured: true };

  const days = Math.floor(diff / 86400);
  if (days > 365) {
    const years = Math.floor(days / 365);
    const remainDays = days % 365;
    return { text: `${years}y ${remainDays}d`, matured: false };
  }
  if (days > 0) return { text: `${days}d remaining`, matured: false };

  const hours = Math.floor(diff / 3600);
  return { text: `${hours}h remaining`, matured: false };
}

export function getMaturityDate(maturityTs: BN): string {
  const date = new Date(maturityTs.toNumber() * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function shortenAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

import { VAULT_CONFIGS, VaultConfig } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";

export function findVaultConfig(vaultPubkey: string): VaultConfig | undefined {
  for (const config of VAULT_CONFIGS) {
    const [pda] = deriveVaultPda(config.region, config.denomination, config.assetSubtype);
    if (pda.toBase58() === vaultPubkey) return config;
  }
  return undefined;
}
