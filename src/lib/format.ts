import { BN } from "@coral-xyz/anchor";

// Safe BN→number conversion for display. Clamps to MAX_SAFE_INTEGER instead of throwing on u64 overflow.
export function bnToSafeNumber(bn: BN): number {
  const MAX = new BN(Number.MAX_SAFE_INTEGER);
  return bn.gt(MAX) ? Number.MAX_SAFE_INTEGER : bn.toNumber();
}

// Divide BN by 10^decimals without overflow. Splits into whole/fractional parts.
export function bnToDecimal(bn: BN, decimals: number): number {
  const divisor = new BN(10).pow(new BN(decimals));
  const whole = bn.div(divisor);
  const frac = bn.mod(divisor);
  return bnToSafeNumber(whole) + bnToSafeNumber(frac) / Math.pow(10, decimals);
}

export function formatUsdc(amount: BN): string {
  const val = bnToDecimal(amount, 6);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
}

export function formatNav(navPerShare: BN): string {
  const val = bnToDecimal(navPerShare, 6);
  return `$${val.toFixed(6)}`;
}

export function formatApy(apyBps: BN): string {
  // apyBps is bounded (typically <10000), safe to toNumber()
  const val = apyBps.toNumber() / 100;
  return `${val.toFixed(1)}%`;
}

export function formatTokens(amount: BN): string {
  const val = bnToDecimal(amount, 6);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(val);
}

export function formatShares(shares: BN): string {
  const val = bnToDecimal(shares, 6);
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(val);
}

export function getMaturityCountdown(maturityTs: BN): { text: string; matured: boolean } {
  const now = Date.now() / 1000;
  // Unix timestamps fit well within MAX_SAFE_INTEGER this millennium.
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
  // Unix timestamps fit well within MAX_SAFE_INTEGER this millennium.
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
    const [pda] = deriveVaultPda(config.region, config.denomination, config.assetSubtype, config.series);
    if (pda.toBase58() === vaultPubkey) return config;
  }
  return undefined;
}
