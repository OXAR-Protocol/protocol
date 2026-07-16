import { PublicKey } from "@solana/web3.js";

import { SOL_MINT, type WalletAsset } from "@oxar/sdk";

/** Keep this much SOL back for the transfer fee (+ a small buffer). */
export const SOL_SEND_RESERVE = BigInt(1_000_000); // 0.001 SOL

/** A recipient address is valid if it parses as a Solana public key. */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address.trim());
    return true;
  } catch {
    return false;
  }
}

/** A 20-byte hex EVM address (0x + 40 hex chars). */
export function isValidEvmAddress(address: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(address.trim());
}

/** Validate a destination address for the chosen chain. */
export function isValidAddressForChain(address: string, chain: "solana" | "ethereum"): boolean {
  return chain === "ethereum" ? isValidEvmAddress(address) : isValidSolanaAddress(address);
}

/** Max base units the user can send of an asset. Reserves SOL for the fee ONLY when
 *  `reserveGas` is true — embedded (Privy-sponsored) wallets pay no fee. */
export function maxSendable(asset: WalletAsset, reserveGas = true): bigint {
  if (asset.mint !== SOL_MINT || !reserveGas) return asset.amount;
  const max = asset.amount - SOL_SEND_RESERVE;
  return max > BigInt(0) ? max : BigInt(0);
}

/** Validate a send request; returns an error string or null if OK. The address is
 *  checked against `chain` (the DESTINATION chain — EVM for a bridge), default Solana. */
export function validateSend(params: {
  asset: WalletAsset | null;
  to: string;
  amountBase: bigint;
  chain?: "solana" | "ethereum";
  reserveGas?: boolean;
}): string | null {
  const { asset, to, amountBase, chain = "solana", reserveGas = true } = params;
  if (!asset) return "Pick an asset to send";
  if (!isValidAddressForChain(to, chain))
    return chain === "ethereum" ? "Enter a valid wallet address" : "Enter a valid Solana address";
  if (amountBase <= BigInt(0)) return "Enter an amount";
  if (amountBase > maxSendable(asset, reserveGas)) {
    return asset.mint === SOL_MINT ? "Not enough SOL (leave a little for the fee)" : `Not enough ${asset.symbol}`;
  }
  return null;
}
