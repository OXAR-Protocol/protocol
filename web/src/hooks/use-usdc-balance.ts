"use client";

import { USDC_MINT, USDC_DECIMALS } from "@/lib/constants";
import { useTokenBalance } from "./use-token-balance";

/** Wallet USDC balance — thin wrapper over the generic token-balance hook. */
export function useUsdcBalance() {
  return useTokenBalance(USDC_MINT, USDC_DECIMALS);
}
