"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Transaction,
  VersionedTransaction,
  type PublicKey,
  type TransactionInstruction,
} from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { getProvider, toFriendlyError } from "@/lib/yield";

/**
 * Deposit / withdraw against a yield provider (Jupiter Lend, Kamino, …). Funds go
 * directly into the protocol — no OXAR contract. Providers expose EITHER raw
 * instructions (`build*Ixs`, assembled into a legacy tx here) OR a fully-built
 * VersionedTransaction (`build*Tx`, e.g. Kamino). Either way the Privy wallet
 * signs+sends (no `.rpc()`). `amount` is in base units (USDC = 6 decimals).
 */
export function useYieldActions(providerId: string) {
  const { wallet, connection, walletAddress } = useSolanaContext();
  const yieldProvider = useMemo(() => getProvider(providerId), [providerId]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendIxs = useCallback(
    async (ixs: TransactionInstruction[], opts?: { sponsor?: boolean }): Promise<string> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      const tx = new Transaction().add(...ixs);
      // signAndSend handles blockhash/feePayer + the embedded-vs-external split.
      const sig = await wallet.signAndSend(tx, opts);
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [wallet, connection, walletAddress],
  );

  const sendTx = useCallback(
    async (tx: VersionedTransaction | Transaction, opts?: { sponsor?: boolean }): Promise<string> => {
      if (!wallet) throw new Error("Wallet not connected");
      const sig = await wallet.signAndSend(tx, opts);
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [wallet, connection],
  );

  const run = useCallback(
    async (action: (owner: PublicKey) => Promise<string>): Promise<string> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      if (!yieldProvider) throw new Error(`Unknown yield provider: ${providerId}`);
      setLoading(true);
      setError(null);
      try {
        return await action(walletAddress);
      } catch (e) {
        // Keep the raw error in the console for debugging; show the user a friendly one.
        console.error("Yield action failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [wallet, walletAddress, yieldProvider, providerId],
  );

  const deposit = useCallback(
    (amount: bigint, opts?: { sponsor?: boolean }) => {
      if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");
      return run(async (owner) => {
        const p = yieldProvider!;
        if (p.buildDepositTx) return sendTx(await p.buildDepositTx({ owner, amount, connection }), opts);
        if (p.buildDepositIxs) return sendIxs(await p.buildDepositIxs({ owner, amount, connection }), opts);
        throw new Error("This source does not support deposits");
      });
    },
    [run, yieldProvider, connection, sendTx, sendIxs],
  );

  const withdraw = useCallback(
    (amount: bigint) => {
      if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");
      return run(async (owner) => {
        const p = yieldProvider!;
        if (p.buildWithdrawTx) return sendTx(await p.buildWithdrawTx({ owner, amount, connection }));
        if (p.buildWithdrawIxs) return sendIxs(await p.buildWithdrawIxs({ owner, amount, connection }));
        throw new Error("This source does not support withdrawals");
      });
    },
    [run, yieldProvider, connection, sendTx, sendIxs],
  );

  // Full exit: providers with a tx path do a max-withdraw; ixs providers redeem all shares.
  const redeemAll = useCallback(
    (shares: bigint) => {
      return run(async (owner) => {
        const p = yieldProvider!;
        if (p.buildRedeemTx) return sendTx(await p.buildRedeemTx({ owner, connection }));
        if (shares <= BigInt(0)) throw new Error("Nothing to withdraw");
        if (p.buildRedeemIxs) return sendIxs(await p.buildRedeemIxs({ owner, shares, connection }));
        throw new Error("This source does not support withdrawals");
      });
    },
    [run, yieldProvider, connection, sendTx, sendIxs],
  );

  return { deposit, withdraw, redeemAll, loading, error };
}
