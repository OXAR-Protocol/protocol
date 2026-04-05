"use client";

import { BN } from "@coral-xyz/anchor";
import { Card, CardContent } from "@/components/ui/card";
import { formatUsdc } from "@/lib/format";

interface BalanceCardsProps {
  solBalance: number;
  usdcBalance: BN;
  totalValue: BN;
  positionsCount: number;
}

export function BalanceCards({ solBalance, usdcBalance, totalValue, positionsCount }: BalanceCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
      <Card className="border-gray-800 bg-gray-900">
        <CardContent className="pt-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">SOL Balance</p>
          <p className="mt-2 text-3xl font-bold text-white">{solBalance.toFixed(4)}</p>
        </CardContent>
      </Card>
      <Card className="border-gray-800 bg-gray-900">
        <CardContent className="pt-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">USDC Balance</p>
          <p className="mt-2 text-3xl font-bold text-white">{formatUsdc(usdcBalance)}</p>
        </CardContent>
      </Card>
      <Card className="border-gray-800 bg-gray-900">
        <CardContent className="pt-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Portfolio Value</p>
          <p className="mt-2 text-3xl font-bold text-[#00D4AA]">{formatUsdc(totalValue)}</p>
        </CardContent>
      </Card>
      <Card className="border-gray-800 bg-gray-900">
        <CardContent className="pt-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Positions</p>
          <p className="mt-2 text-3xl font-bold text-white">{positionsCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
