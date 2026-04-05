"use client";

import { usePrivy } from "@privy-io/react-auth";
import { Card, CardContent } from "@/components/ui/card";

export function WalletMissing() {
  const { user, authenticated } = usePrivy();
  const accounts = user?.linkedAccounts || [];
  const solanaWallet = accounts.find((a: any) => a.type === "wallet" && a.chainType === "solana") as any;
  const ethWallet = accounts.find((a: any) => a.type === "wallet" && a.chainType === "ethereum") as any;

  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardContent className="py-8 space-y-4">
        <p className="text-gray-400 text-center">
          {!authenticated
            ? "Please log in to view your portfolio."
            : !solanaWallet
            ? "Setting up your Solana wallet... Please refresh the page in a few seconds."
            : "Connecting to your wallet..."}
        </p>
        <div className="text-xs text-gray-600 text-center space-y-1">
          <p>Status: {authenticated ? "Logged in" : "Not logged in"}</p>
          <p>Accounts: {accounts.length} ({accounts.map((a: any) => `${a.type}:${a.chainType || a.address?.slice(0,8)}`).join(", ")})</p>
          {solanaWallet && <p>Solana: {solanaWallet.address}</p>}
          {ethWallet && <p>Ethereum: {ethWallet.address}</p>}
          {!solanaWallet && authenticated && (
            <p className="text-yellow-400 mt-2">Solana wallet not found. Try logging out and back in, or refresh the page.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
