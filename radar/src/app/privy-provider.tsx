"use client";

import { PrivyProvider } from "@privy-io/react-auth";

import { PRIVY_APP_ID } from "@/lib/privy";

export function RadarPrivyProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#00d97e",
          logo: "https://oxar.app/icon.svg",
        },
        loginMethods: ["email", "wallet", "google", "github"],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
