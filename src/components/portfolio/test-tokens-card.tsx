"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TestTokensCardProps {
  airdropping: boolean;
  airdropMsg: string | null;
  faucetLoading: boolean;
  faucetMsg: string | null;
  onAirdropSol: () => void;
  onFaucet: () => void;
}

export function TestTokensCard({
  airdropping,
  airdropMsg,
  faucetLoading,
  faucetMsg,
  onAirdropSol,
  onFaucet,
}: TestTokensCardProps) {
  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Test Tokens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={onAirdropSol}
            disabled={airdropping}
            size="sm"
            className="bg-[#00D4AA] text-gray-950 font-semibold hover:bg-[#00B892] disabled:opacity-50"
          >
            {airdropping ? "Airdropping..." : "Get 1 Test SOL"}
          </Button>
          <p className="text-xs text-gray-500">
            SOL is needed for transaction fees.
          </p>
        </div>
        {airdropMsg && (
          <p className={`text-xs ${airdropMsg.includes("sent") || airdropMsg.includes("success") ? "text-emerald-400" : "text-red-400"}`}>
            {airdropMsg}
          </p>
        )}
        <div className="flex items-center gap-3">
          <Button
            onClick={onFaucet}
            disabled={faucetLoading}
            size="sm"
            className="bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {faucetLoading ? "Sending..." : "Get 10,000 Test USDC"}
          </Button>
          <p className="text-xs text-gray-500">
            Test USDC for deposits. Rate limited to once per 5 minutes.
          </p>
        </div>
        {faucetMsg && (
          <p className={`text-xs ${faucetMsg.includes("sent") ? "text-emerald-400" : "text-red-400"}`}>
            {faucetMsg}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
