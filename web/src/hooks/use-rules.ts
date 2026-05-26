"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

import { deriveRulePda } from "@oxar/sdk";

import { useOxarProgram } from "./use-oxar-program";

export type DestinationKind = "personalYield" | "groupVault" | "stayInWallet";
export type Direction = "receives" | "sends";
export type Comparator =
  | "greater"
  | "greaterOrEqual"
  | "equal"
  | "lessOrEqual"
  | "less";

export interface RuleDestination {
  destType: DestinationKind;
  percentBps: number;
  target: PublicKey | null; // null for stayInWallet
}

export interface RuleData {
  pda: PublicKey;
  owner: PublicKey;
  ruleId: BN;
  isActive: boolean;
  lastTriggeredAt: BN;
  triggerCount: number;
  triggerWallet: PublicKey;
  triggerMint: PublicKey;
  direction: Direction;
  comparator: Comparator;
  amount: BN;
  destinationsUsed: number;
  destinations: RuleDestination[];
}

function variantKey<T extends string>(obj: any): T {
  return Object.keys(obj)[0] as T;
}

export function useUserRules() {
  const { program, walletAddress } = useOxarProgram();
  const [rules, setRules] = useState<RuleData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!program || !walletAddress) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // SAFETY: Anchor dynamic accounts
      const all: any[] = await (program.account as any).rule.all([
        {
          memcmp: {
            offset: 8, // discriminator
            bytes: walletAddress.toBase58(),
          },
        },
      ]);
      const list: RuleData[] = all.map((entry) => {
        const acc = entry.account;
        return {
          pda: entry.publicKey,
          owner: acc.owner,
          ruleId: acc.ruleId,
          isActive: acc.isActive,
          lastTriggeredAt: acc.lastTriggeredAt,
          triggerCount: acc.triggerCount,
          triggerWallet: acc.trigger.wallet,
          triggerMint: acc.trigger.mint,
          direction: variantKey<Direction>(acc.trigger.direction),
          comparator: variantKey<Comparator>(acc.trigger.comparator),
          amount: acc.trigger.amount,
          destinationsUsed: acc.action.destinationsUsed,
          destinations: acc.action.destinations
            .slice(0, acc.action.destinationsUsed)
            .map((d: any) => ({
              destType: variantKey<DestinationKind>(d.destType),
              percentBps: d.percentBps,
              target: d.target,
            })),
        };
      });
      setRules(list);
    } catch (err) {
      console.error("Failed to fetch rules:", err);
    } finally {
      setLoading(false);
    }
  }, [program, walletAddress]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { rules, loading, refetch: fetch };
}

export interface CreateRuleInput {
  /// Wallet to monitor for balance changes. Defaults to owner's wallet.
  triggerWallet: PublicKey;
  /// Mint to watch. PublicKey.default() for native SOL.
  triggerMint: PublicKey;
  /// Decimals of the mint (used to scale `amount`). 6 for USDC/USDT, 9 for SOL.
  mintDecimals: number;
  direction: Direction;
  comparator: Comparator;
  /// Amount in human units (e.g. 100.5). Will be scaled by `mintDecimals`.
  amount: number;
  destinations: {
    destType: DestinationKind;
    percentBps: number;
    target: PublicKey | null;
  }[];
}

function destVariant(kind: DestinationKind): Record<string, {}> {
  return { [kind]: {} };
}

function dirVariant(d: Direction): Record<string, {}> {
  return { [d]: {} };
}

function cmpVariant(c: Comparator): Record<string, {}> {
  return { [c]: {} };
}

export function useRuleActions() {
  const { program, provider, connection, walletAddress } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (tx: Transaction): Promise<string> => {
      if (!provider || !walletAddress) throw new Error("Wallet not connected");
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = walletAddress;
      const signed = await provider.wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [provider, connection, walletAddress],
  );

  const createRule = useCallback(
    async (
      input: CreateRuleInput,
    ): Promise<{ rulePda: PublicKey; signature: string } | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      const bpsSum = input.destinations.reduce((a, d) => a + d.percentBps, 0);
      if (bpsSum !== 10_000) {
        setError("Destinations must sum to 100%");
        return null;
      }
      if (input.destinations.length === 0 || input.destinations.length > 5) {
        setError("1-5 destinations required");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const ruleIdBig = BigInt(Math.floor(Date.now() / 1000));
        const ruleId = new BN(ruleIdBig.toString());
        const [rulePda] = deriveRulePda(walletAddress, ruleIdBig);

        const padded = Array.from({ length: 5 }, (_, i) => {
          const d = input.destinations[i];
          if (!d) {
            return {
              destType: { stayInWallet: {} },
              percentBps: 0,
              target: PublicKey.default,
            };
          }
          return {
            destType: destVariant(d.destType),
            percentBps: d.percentBps,
            target: d.target ?? PublicKey.default,
          };
        });

        const scale = Math.pow(10, input.mintDecimals);
        const scaledAmount = new BN(Math.floor(input.amount * scale));

        const params = {
          ruleId,
          ruleType: { autoDistribute: {} },
          trigger: {
            wallet: input.triggerWallet,
            mint: input.triggerMint,
            direction: dirVariant(input.direction),
            comparator: cmpVariant(input.comparator),
            amount: scaledAmount,
          },
          action: {
            destinations: padded,
            destinationsUsed: input.destinations.length,
          },
        };

        const ix = await program.methods
          .createRule(params as any)
          .accounts({
            owner: walletAddress,
            rule: rulePda,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        const signature = await send(tx);
        return { rulePda, signature };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Create rule failed";
        console.error("createRule error:", err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, send],
  );

  const cancelRule = useCallback(
    async (rulePda: PublicKey, _ruleId: BN): Promise<string | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const ix = await program.methods
          .cancelRule()
          .accounts({
            owner: walletAddress,
            rule: rulePda,
          } as any)
          .instruction();
        const tx = new Transaction().add(ix);
        return await send(tx);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Cancel rule failed";
        console.error("cancelRule error:", err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, send],
  );

  return { createRule, cancelRule, loading, error };
}
