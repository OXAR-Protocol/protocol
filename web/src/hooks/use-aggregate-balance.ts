"use client";

import { useCallback, useEffect, useState } from "react";
import { BN } from "@coral-xyz/anchor";

import { YIELD_SOURCES } from "@oxar/sdk";
import { usePersonalVault } from "./use-personal-vault";

/**
 * Aggregate balance across all personal vaults (one per yield-source).
 * Group vault balances are tracked separately via use-group-vault.
 */
export function useAggregatePersonalBalance() {
  // One hook call per yield source. Order is stable so hook count never changes.
  const vaults = YIELD_SOURCES.map((s) => usePersonalVault(s.id));

  const [totalUsdc, setTotalUsdc] = useState(0);
  const [vaultCount, setVaultCount] = useState(0);

  const compute = useCallback(() => {
    let total = new BN(0);
    let count = 0;
    for (const v of vaults) {
      if (v.exists && !v.totalShares.isZero()) {
        const value = v.totalShares.mul(v.navPerShare).div(new BN(1_000_000));
        total = total.add(value);
        count += 1;
      }
    }
    setTotalUsdc(total.toNumber() / 1_000_000);
    setVaultCount(count);
    // SAFETY: vaults array length is YIELD_SOURCES.length (constant); React linter
    // wants vaults as dep but that re-renders every time any vault refetches —
    // which is exactly what we want.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, vaults);

  useEffect(() => {
    compute();
  }, [compute]);

  const loading = vaults.some((v) => v.loading);
  const refetch = () => vaults.forEach((v) => v.refetch());

  return { totalUsdc, vaultCount, loading, refetch };
}
