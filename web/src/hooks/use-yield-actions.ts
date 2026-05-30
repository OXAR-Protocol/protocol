"use client";

import { useCallback, useMemo, useState } from "react";
import { Transaction, type TransactionInstruction } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { getProvider, toFriendlyError } from "@/lib/yield";

/**
 * Deposit / withdraw against a yield provider (Jupiter Lend, Kamino, …) via its
 * own SDK. Funds go directly into the protocol — no OXAR contract. Mirrors the
 * Privy sign+send pattern (no `.rpc()`).
 *
 * `amount` is in the asset's base units (USDC = 6 decimals).
 */
export function useYieldActions(providerId: string) {
  const { wallet, connection, walletAddress } = useSolanaContext();
  const yieldProvider = useMemo(() => getProvider(providerId), [providerId]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assemble, sign (Privy pattern — no `.rpc()`), send, confirm.
  const send = useCallback(
    async (ixs: TransactionInstruction[]): Promise<string> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");

      const tx = new Transaction().add(...ixs);
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = walletAddress;

      const signed = await wallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [wallet, connection, walletAddress],
  );

  const run = useCallback(
    async (
      build: (owner: NonNullable<typeof walletAddress>) => Promise<TransactionInstruction[]>,
    ): Promise<string> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      if (!yieldProvider) throw new Error(`Unknown yield provider: ${providerId}`);

      setLoading(true);
      setError(null);
      try {
        return await send(await build(walletAddress));
      } catch (e) {
        // Keep the raw error in the console for debugging; show the user a friendly one.
        console.error("Yield action failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [wallet, walletAddress, yieldProvider, providerId, send],
  );

  const deposit = useCallback(
    (amount: bigint) => {
      if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");
      return run((owner) => yieldProvider!.buildDepositIxs({ owner, amount, connection }));
    },
    [run, yieldProvider, connection],
  );

  const withdraw = useCallback(
    (amount: bigint) => {
      if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");
      return run((owner) => yieldProvider!.buildWithdrawIxs({ owner, amount, connection }));
    },
    [run, yieldProvider, connection],
  );

  // Full exit: redeem the entire share balance so no rounding dust is stranded.
  const redeemAll = useCallback(
    (shares: bigint) => {
      if (shares <= BigInt(0)) throw new Error("Nothing to withdraw");
      return run((owner) => yieldProvider!.buildRedeemIxs({ owner, shares, connection }));
    },
    [run, yieldProvider, connection],
  );

  return { deposit, withdraw, redeemAll, loading, error };
}
