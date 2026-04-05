"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VaultAccount } from "@/hooks/use-vaults";

interface DepositFormProps {
  vault: VaultAccount | null;
  depositAmount: string;
  depositing: boolean;
  depositError: string | null;
  txHash: string | null;
  onDepositAmountChange: (value: string) => void;
  onDeposit: () => void;
}

export function DepositForm({
  vault,
  depositAmount,
  depositing,
  depositError,
  txHash,
  onDepositAmountChange,
  onDeposit,
}: DepositFormProps) {
  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Deposit USDC</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!vault ? (
          <p className="text-sm text-gray-500">
            Deposits are unavailable until the vault is initialized on-chain.
          </p>
        ) : (
          <>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Amount (USDC)
              </label>
              <Input
                type="number"
                placeholder="0.00"
                value={depositAmount}
                onChange={(e) => onDepositAmountChange(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                min="0"
                step="0.01"
              />
            </div>

            <Button
              onClick={onDeposit}
              disabled={depositing || !depositAmount}
              className="w-full bg-[#00D4AA] text-gray-950 font-semibold hover:bg-[#00B892] disabled:opacity-50"
            >
              {depositing ? "Processing..." : "Deposit"}
            </Button>

            {depositError && (
              <p className="text-xs text-red-400">{depositError}</p>
            )}

            {txHash && (
              <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-3">
                <p className="text-xs text-emerald-400">Deposit successful!</p>
                <p className="text-xs text-gray-500 font-mono mt-1 break-all">
                  {txHash}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
