"use client";

import { ReactNode } from "react";
import { PrivyProvider } from "./privy-provider";
import { SolanaProvider } from "./solana-provider";
import { LocaleProvider } from "@/lib/i18n";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <PrivyProvider>
        <SolanaProvider>{children}</SolanaProvider>
      </PrivyProvider>
    </LocaleProvider>
  );
}
