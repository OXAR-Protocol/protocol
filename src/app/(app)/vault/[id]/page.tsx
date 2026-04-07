"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useVault } from "@/hooks/use-vault";
import { getVaultConfigById, parseVaultId } from "@/lib/constants";
import { VaultHeader } from "@/components/vault-detail/vault-header";
import { YieldCalculator } from "@/components/vault-detail/yield-calculator";
import { InvestButton } from "@/components/vault-detail/invest-button";
import { VaultInfo } from "@/components/vault-detail/vault-info";

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const vaultId = params.id as string;
  const config = getVaultConfigById(vaultId);
  const parsed = parseVaultId(vaultId);

  const { vault, vaultPda, loading } = useVault(
    parsed.region,
    parsed.denomination,
    parsed.assetSubtype
  );

  const [amount, setAmount] = useState("");

  if (!config) {
    return (
      <div className="py-20 text-center">
        <p className="text-white/40 font-mono text-sm">Vault not found.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  const apyBps = vault?.account.apyBps.toNumber() ?? config.apy * 100;

  return (
    <div className="py-6 space-y-6">
      <VaultHeader config={config} vault={vault} />
      <YieldCalculator
        apyBps={apyBps}
        amount={amount}
        setAmount={setAmount}
      />
      <InvestButton
        amount={amount}
        vaultPda={vaultPda}
        onSuccess={() => {
          setTimeout(() => router.push("/portfolio"), 1500);
        }}
      />
      <VaultInfo vault={vault} config={config} />
    </div>
  );
}
