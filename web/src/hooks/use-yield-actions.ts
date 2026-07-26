"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Transaction,
  VersionedTransaction,
  type PublicKey,
  type TransactionInstruction,
} from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { getProvider, toFriendlyError, fromBaseUnits } from "@/lib/yield";
import { recordBasisDelta } from "@/lib/earnings/pending-basis";

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

  /**
   * Tell the earnings view what this action did to the net invested, so `earned`
   * stays honest until the indexer catches up — otherwise a top-up reads as
   * profit for minutes (see `lib/earnings/pending-basis`). Deposits add, withdraws
   * subtract; a full redeem needs none, since a zero position is filtered out.
   */
  const noteBasis = useCallback(
    (owner: PublicKey, amount: bigint, sign: 1 | -1) => {
      const decimals = yieldProvider?.decimals;
      if (decimals === undefined) return;
      recordBasisDelta(owner.toBase58(), providerId, sign * fromBaseUnits(amount, decimals));
    },
    [yieldProvider, providerId],
  );

  const deposit = useCallback(
    (amount: bigint, opts?: { sponsor?: boolean }) => {
      if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");
      return run(async (owner) => {
        const p = yieldProvider!;
        if (!p.buildDepositTx && !p.buildDepositIxs) {
          throw new Error("This source does not support deposits");
        }
        const sig = p.buildDepositTx
          ? await sendTx(await p.buildDepositTx({ owner, amount, connection }), opts)
          : await sendIxs(await p.buildDepositIxs!({ owner, amount, connection }), opts);
        noteBasis(owner, amount, 1);
        return sig;
      });
    },
    [run, yieldProvider, connection, sendTx, sendIxs, noteBasis],
  );

  const withdraw = useCallback(
    (amount: bigint) => {
      if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");
      return run(async (owner) => {
        const p = yieldProvider!;
        if (!p.buildWithdrawTx && !p.buildWithdrawIxs) {
          throw new Error("This source does not support withdrawals");
        }
        const sig = p.buildWithdrawTx
          ? await sendTx(await p.buildWithdrawTx({ owner, amount, connection }))
          : await sendIxs(await p.buildWithdrawIxs!({ owner, amount, connection }));
        noteBasis(owner, amount, -1);
        return sig;
      });
    },
    [run, yieldProvider, connection, sendTx, sendIxs, noteBasis],
  );

  // Full exit: providers with a tx path do a max-withdraw; ixs providers redeem all shares.
  // `valueUsd` (the position being cashed out) retires its basis: the exited source keeps
  // an indexed basis until the indexer catches up, and a re-entry measured against THAT
  // could never settle — the next indexed answer moves the basis down, not up.
  const redeemAll = useCallback(
    (shares: bigint, valueUsd?: number) => {
      return run(async (owner) => {
        const p = yieldProvider!;
        if (!p.buildRedeemTx && shares <= BigInt(0)) throw new Error("Nothing to withdraw");
        if (!p.buildRedeemTx && !p.buildRedeemIxs) {
          throw new Error("This source does not support withdrawals");
        }
        const sig = p.buildRedeemTx
          ? await sendTx(await p.buildRedeemTx({ owner, connection }))
          : await sendIxs(await p.buildRedeemIxs!({ owner, shares, connection }));
        if (valueUsd) recordBasisDelta(owner.toBase58(), providerId, -valueUsd);
        return sig;
      });
    },
    [run, yieldProvider, connection, sendTx, sendIxs, providerId],
  );

  return { deposit, withdraw, redeemAll, loading, error };
}
