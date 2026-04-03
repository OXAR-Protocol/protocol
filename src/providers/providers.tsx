"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "./privy-provider";
import { SolanaProvider } from "./solana-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider>
      <SolanaProvider>{children}</SolanaProvider>
    </PrivyProvider>
  );
}
