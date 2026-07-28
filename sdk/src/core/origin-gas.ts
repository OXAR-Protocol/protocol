import { EVM_NATIVE_SENTINEL } from "./evm-assets";
import { EVM_GAS_RESERVE_USD, DEFAULT_EVM_GAS_RESERVE_USD } from "./assets";
import type { WalletAsset } from "./assets";

/**
 * Can this wallet actually pay the network fee on the chain it's paying FROM?
 *
 * The two legs of a cross-chain deposit are not alike. The Solana leg is sponsored
 * by our relayer, so a wallet holding zero SOL still completes it. The origin leg is
 * an ordinary transaction sent by the user's own wallet, so it costs that chain's
 * NATIVE coin — ETH on Ethereum/Base/Arbitrum/Optimism, POL on Polygon. There is no
 * paymaster on that side, and no amount of USDC pays for it.
 *
 * `spendableBase` already holds gas back when the pay-asset IS the native coin. It
 * cannot help when the user pays with an ERC-20: that spends the token balance and
 * silently assumes native gas exists somewhere. When it doesn't, the wallet rejects
 * the transaction with its own wording, after the user has already committed — which
 * is the worst possible moment to find out.
 */

export type OriginGasStatus =
  /** Nothing to warn about — sponsored leg, or enough native coin is held. */
  | { kind: "ok" }
  /** No native coin at all on the origin chain. */
  | { kind: "missing"; network: string; symbol: string; neededUsd: number }
  /** Some native coin, but under what the fee is likely to cost. */
  | { kind: "low"; network: string; symbol: string; neededUsd: number; haveUsd: number };

/** The native coin's ticker for a network. Polygon pays in POL; the rest in ETH. */
export function nativeSymbolFor(network: string): string {
  return network === "matic-mainnet" ? "POL" : "ETH";
}

/** What the origin-chain fee is budgeted at, in USD. */
export function originGasReserveUsd(network: string): number {
  return EVM_GAS_RESERVE_USD[network] ?? DEFAULT_EVM_GAS_RESERVE_USD;
}

/**
 * Check the pay-asset against everything the wallet holds.
 *
 * Deliberately NOT a hard block: the reserve figures are per-network heuristics, not
 * a quote for this exact transaction, so refusing on them could lock out someone who
 * has plenty. It reports, and lets the user decide.
 */
export function checkOriginGas(
  payAsset: WalletAsset | null,
  held: readonly WalletAsset[],
): OriginGasStatus {
  // The Solana leg is relayer-sponsored — a 0-SOL wallet is fine there.
  if (!payAsset || payAsset.chain !== "ethereum") return { kind: "ok" };

  const network = payAsset.network ?? "";
  const neededUsd = originGasReserveUsd(network);
  const symbol = nativeSymbolFor(network);

  const native = held.find(
    (a) => a.chain === "ethereum" && a.network === network && a.mint === EVM_NATIVE_SENTINEL,
  );

  // Paying with the native coin itself: `spendableBase` holds the fee back, so the
  // only failure left is a balance that is entirely fee. Report the same shortfall.
  const haveUsd = native?.usdValue ?? 0;
  if (!native || haveUsd <= 0) return { kind: "missing", network, symbol, neededUsd };
  if (haveUsd < neededUsd) return { kind: "low", network, symbol, neededUsd, haveUsd };
  return { kind: "ok" };
}
