"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BN } from "@coral-xyz/anchor";
import { Nav } from "@/components/nav";
import { Badge } from "@/components/ui/badge";
import { useVault } from "@/hooks/use-vault";
import { useDeposit } from "@/hooks/use-deposit";
import { getVaultConfigById, parseVaultId } from "@/lib/constants";
import { VaultStats } from "@/components/vault/vault-stats";
import { DepositForm } from "@/components/vault/deposit-form";

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;
  const config = getVaultConfigById(vaultId);
  const parsed = parseVaultId(vaultId);

  const { vault, vaultPda, loading, error } = useVault(
    parsed.region,
    parsed.denomination,
    parsed.assetSubtype
  );
  const { deposit, loading: depositing, error: depositError } = useDeposit();

  const [depositAmount, setDepositAmount] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Nav />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <p className="text-gray-400">Vault not found.</p>
        </main>
      </div>
    );
  }

  const handleDeposit = async () => {
    if (!vaultPda || !depositAmount) return;
    const amountFloat = parseFloat(depositAmount);
    if (isNaN(amountFloat) || amountFloat <= 0) return;

    const amountBn = new BN(Math.floor(amountFloat * 1_000_000));
    const tx = await deposit(vaultPda, amountBn);
    if (tx) {
      setTxHash(tx);
      setDepositAmount("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <Nav />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.back()}
          className="mb-6 text-sm text-gray-400 hover:text-white transition-colors"
        >
          &larr; Back to Vaults
        </button>

        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white">{config.label}</h1>
          {config.isWar && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              WAR
            </Badge>
          )}
          {config.hasFxRisk && (
            <Badge variant="outline" className="border-yellow-500/40 text-yellow-400">
              FX Risk
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-[#00D4AA]" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <VaultStats vault={vault} config={config} parsed={parsed} error={error} />
            </div>

            <div>
              <DepositForm
                vault={vault}
                depositAmount={depositAmount}
                depositing={depositing}
                depositError={depositError}
                txHash={txHash}
                onDepositAmountChange={setDepositAmount}
                onDeposit={handleDeposit}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
