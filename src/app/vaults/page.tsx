"use client";

import { Nav } from "@/components/nav";
import { VaultCard } from "@/components/vault-card";
import { useVaults } from "@/hooks/use-vaults";
import { VAULT_CONFIGS } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";

export default function VaultsPage() {
  const { vaults, loading } = useVaults();

  function findVaultData(region: string, denomination: string, assetSubtype: string) {
    const [pda] = deriveVaultPda(region, denomination, assetSubtype);
    return vaults.find((v) => v.publicKey.toBase58() === pda.toBase58());
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Vaults</h1>
          <p className="mt-2 text-gray-400">
            Choose a government bond vault to deposit USDC and earn yield.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-[#00D4AA]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VAULT_CONFIGS.map((config) => (
              <VaultCard
                key={config.id}
                config={config}
                vaultData={findVaultData(
                  config.region,
                  config.denomination,
                  config.assetSubtype
                )}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
