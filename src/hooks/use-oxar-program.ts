"use client";

import { useSolanaContext } from "@/providers/solana-provider";

export function useOxarProgram() {
  const { program, provider, walletAddress, connection } = useSolanaContext();
  return { program, provider, walletAddress, connection };
}
