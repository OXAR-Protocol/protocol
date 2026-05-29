/** Human amount → base units (e.g. 50 USDC → 50_000_000n at 6 decimals). */
export function toBaseUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.round(amount * 10 ** decimals));
}

/** Base units → human amount (e.g. 50_000_000n → 50 at 6 decimals). */
export function fromBaseUnits(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}
