"use client";

import { useCallback, useEffect, useState } from "react";
import { BN } from "@coral-xyz/anchor";

import { usePersonalVault } from "./use-personal-vault";

/**
 * Aggregate balance across all personal vaults (Sleepy, Walking, Running).
 * Group vault balances are tracked separately via use-group-vault.
 */
export function useAggregatePersonalBalance() {
  const sleepy = usePersonalVault("sleepy");
  const walking = usePersonalVault("walking");
  const running = usePersonalVault("running");

  const [totalUsdc, setTotalUsdc] = useState(0);
  const [vaultCount, setVaultCount] = useState(0);

  const compute = useCallback(() => {
    let total = new BN(0);
    let count = 0;
    for (const v of [sleepy, walking, running]) {
      if (v.exists && !v.totalShares.isZero()) {
        const value = v.totalShares.mul(v.navPerShare).div(new BN(1_000_000));
        total = total.add(value);
        count += 1;
      }
    }
    setTotalUsdc(total.toNumber() / 1_000_000);
    setVaultCount(count);
  }, [sleepy, walking, running]);

  useEffect(() => {
    compute();
  }, [compute]);

  const loading = sleepy.loading || walking.loading || running.loading;

  const refetch = () => {
    sleepy.refetch();
    walking.refetch();
    running.refetch();
  };

  return { totalUsdc, vaultCount, loading, refetch };
}
