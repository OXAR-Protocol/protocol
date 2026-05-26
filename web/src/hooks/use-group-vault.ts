"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { deriveGroupMemberPda } from "@oxar/sdk";

import { useOxarProgram } from "./use-oxar-program";

export interface GroupVaultData {
  pda: PublicKey;
  vault: PublicKey;
  creator: PublicKey;
  name: string;
  goalAmount: BN;
  goalDeadline: BN;
  memberCount: number;
  isActive: boolean;
  createdAt: BN;
}

export interface BackingVaultData {
  totalDeposits: BN;
  totalShares: BN;
  navPerShare: BN;
  hotPoolBalance: BN;
}

export interface GroupMemberData {
  depositedAmount: BN;
  sharesOwned: BN;
  joinedAt: BN;
  displayName: string;
}

export function useGroupVault(groupVaultPda: PublicKey | null) {
  const { program, walletAddress } = useOxarProgram();
  const [group, setGroup] = useState<GroupVaultData | null>(null);
  const [backing, setBacking] = useState<BackingVaultData | null>(null);
  const [member, setMember] = useState<GroupMemberData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!program || !groupVaultPda) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // SAFETY: Anchor IDL dynamic account names
      const groupAcc = await (program.account as any).groupVault.fetchNullable(
        groupVaultPda,
      );
      if (!groupAcc) {
        setGroup(null);
        setBacking(null);
        setMember(null);
        setLoading(false);
        return;
      }
      const groupData: GroupVaultData = {
        pda: groupVaultPda,
        vault: groupAcc.vault as PublicKey,
        creator: groupAcc.creator as PublicKey,
        name: groupAcc.name as string,
        goalAmount: groupAcc.goalAmount as BN,
        goalDeadline: groupAcc.goalDeadline as BN,
        memberCount: groupAcc.memberCount as number,
        isActive: groupAcc.isActive as boolean,
        createdAt: groupAcc.createdAt as BN,
      };
      setGroup(groupData);

      const vaultAcc = await (program.account as any).vault.fetchNullable(
        groupData.vault,
      );
      if (vaultAcc) {
        setBacking({
          totalDeposits: vaultAcc.totalDeposits as BN,
          totalShares: vaultAcc.totalShares as BN,
          navPerShare: vaultAcc.navPerShare as BN,
          hotPoolBalance: vaultAcc.hotPoolBalance as BN,
        });
      }

      if (walletAddress) {
        const [memberPda] = deriveGroupMemberPda(groupVaultPda, walletAddress);
        const memberAcc = await (program.account as any).groupMember.fetchNullable(
          memberPda,
        );
        if (memberAcc) {
          setMember({
            depositedAmount: memberAcc.depositedAmount as BN,
            sharesOwned: memberAcc.sharesOwned as BN,
            joinedAt: memberAcc.joinedAt as BN,
            displayName: memberAcc.displayName as string,
          });
        } else {
          setMember(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch group vault:", err);
    } finally {
      setLoading(false);
    }
  }, [program, groupVaultPda, walletAddress]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { group, backing, member, loading, refetch: fetch };
}

export function useUserGroupVaults() {
  const { program, walletAddress } = useOxarProgram();
  const [created, setCreated] = useState<GroupVaultData[]>([]);
  const [joined, setJoined] = useState<GroupVaultData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!program || !walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // SAFETY: Anchor account namespace dynamic
      const all: any[] = await (program.account as any).groupVault.all([
        {
          memcmp: {
            offset: 8 + 32, // discriminator + vault pubkey
            bytes: walletAddress.toBase58(),
          },
        },
      ]);
      const createdGroups: GroupVaultData[] = all.map((entry) => ({
        pda: entry.publicKey,
        vault: entry.account.vault,
        creator: entry.account.creator,
        name: entry.account.name,
        goalAmount: entry.account.goalAmount,
        goalDeadline: entry.account.goalDeadline,
        memberCount: entry.account.memberCount,
        isActive: entry.account.isActive,
        createdAt: entry.account.createdAt,
      }));
      setCreated(createdGroups);

      const members: any[] = await (program.account as any).groupMember.all([
        {
          memcmp: {
            offset: 8 + 32, // discriminator + group_vault pubkey
            bytes: walletAddress.toBase58(),
          },
        },
      ]);
      const memberGroups: GroupVaultData[] = [];
      for (const m of members) {
        const groupPda = m.account.groupVault as PublicKey;
        const groupAcc = await (program.account as any).groupVault.fetchNullable(
          groupPda,
        );
        if (groupAcc) {
          memberGroups.push({
            pda: groupPda,
            vault: groupAcc.vault,
            creator: groupAcc.creator,
            name: groupAcc.name,
            goalAmount: groupAcc.goalAmount,
            goalDeadline: groupAcc.goalDeadline,
            memberCount: groupAcc.memberCount,
            isActive: groupAcc.isActive,
            createdAt: groupAcc.createdAt,
          });
        }
      }
      // Filter out groups user created (those are in `created`)
      const joinedOnly = memberGroups.filter(
        (g) => !g.creator.equals(walletAddress),
      );
      setJoined(joinedOnly);
    } catch (err) {
      console.error("Failed to fetch user groups:", err);
    } finally {
      setLoading(false);
    }
  }, [program, walletAddress]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { created, joined, loading, refetch: fetch };
}
