"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { useOxarProgram } from "./use-oxar-program";

export interface GroupMemberSummary {
  member: PublicKey;
  displayName: string;
  depositedAmount: BN;
  sharesOwned: BN;
  joinedAt: BN;
}

export function useGroupMembers(groupVaultPda: PublicKey | null) {
  const { program } = useOxarProgram();
  const [members, setMembers] = useState<GroupMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!program || !groupVaultPda) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // SAFETY: Anchor dynamic accounts
      const all: any[] = await (program.account as any).groupMember.all([
        {
          memcmp: {
            offset: 8, // discriminator
            bytes: groupVaultPda.toBase58(),
          },
        },
      ]);
      const list: GroupMemberSummary[] = all.map((entry) => ({
        member: entry.account.member,
        displayName: entry.account.displayName,
        depositedAmount: entry.account.depositedAmount,
        sharesOwned: entry.account.sharesOwned,
        joinedAt: entry.account.joinedAt,
      }));
      // Sort by deposit size descending
      list.sort((a, b) => b.depositedAmount.cmp(a.depositedAmount));
      setMembers(list);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, [program, groupVaultPda]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { members, loading, refetch: fetch };
}
