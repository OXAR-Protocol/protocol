"use client";

import { useState, useMemo } from "react";

import { useVaults } from "@/hooks/use-vaults";
import { VAULT_CONFIGS, VaultConfig } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";
import { OpportunityCost } from "@/components/explore/opportunity-cost";
import { FilterChips } from "@/components/explore/filter-chips";
import { VaultCard } from "@/components/explore/vault-card";

export default function VaultsPage() {
  const { vaults, loading } = useVaults();
  const [filter, setFilter] = useState("All");

  function findVaultData(region: string, denomination: string, assetSubtype: string) {
    const [pda] = deriveVaultPda(region, denomination, assetSubtype);
    return vaults.find((v) => v.publicKey.toBase58() === pda.toBase58());
  }

  const filteredConfigs = useMemo(() => {
    let configs = [...VAULT_CONFIGS] as VaultConfig[];

    switch (filter) {
      case "UAH":
      case "USD":
      case "EUR":
        configs = configs.filter((c) => c.denomination === filter);
        break;
      case "Highest APY":
        configs = configs.sort((a, b) => b.apy - a.apy);
        break;
      case "Short-term":
        configs = configs.filter((c) => c.assetSubtype === "SHORT");
        break;
      default:
        break;
    }

    return configs;
  }, [filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="py-6 space-y-6">
      <OpportunityCost />
      <FilterChips active={filter} onChange={setFilter} />
      <div className="flex flex-col gap-3">
        {filteredConfigs.map((config, index) => (
          <VaultCard
            key={config.id}
            config={config}
            vaultData={findVaultData(config.region, config.denomination, config.assetSubtype)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}
