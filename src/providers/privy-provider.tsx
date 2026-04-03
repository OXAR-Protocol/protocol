"use client";

import { PrivyProvider as PrivyProviderBase } from "@privy-io/react-auth";
import { ReactNode } from "react";

export function PrivyProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

  return (
    <PrivyProviderBase
      appId={appId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00D4AA",
        },
        embeddedWallets: {
          solana: {
            createOnLogin: "users-without-wallets",
          },
        },
      } as any}
    >
      {children}
    </PrivyProviderBase>
  );
}
