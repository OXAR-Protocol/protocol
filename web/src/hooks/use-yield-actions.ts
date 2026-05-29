"use client";

import { useCallback, useMemo, useState } from "react";
import { Transaction } from "@solana/web3.js";

import { useSolanaContext } from "@/providers/solana-provider";
import { getProvider } from "@/lib/yield";

/**
 * Deposit / withdraw against a yield provider (Jupiter Lend, Kamino, …) via its
 * own SDK. Funds go directly into the protocol — no OXAR contract. Mirrors the
 * Privy sign+send pattern (no `.rpc()`).
 *
 * `amount` is in the asset's base units (USDC = 6 decimals).
 */
export function useYieldActions(providerId: string) {
  const { provider, connection, walletAddress } = useSolanaContext();
  const yieldProvider = useMemo(() => getProvider(providerId), [providerId]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (build: "deposit" | "withdraw", amount: bigint): Promise<string> => {
      if (!provider || !walletAddress) throw new Error("Wallet not connected");
      if (!yieldProvider) throw new Error(`Unknown yield provider: ${providerId}`);
      if (amount <= BigInt(0)) throw new Error("Amount must be greater than zero");

      setLoading(true);
      setError(null);
      try {
        const ixs =
          build === "deposit"
            ? await yieldProvider.buildDepositIxs({ owner: walletAddress, amount, connection })
            : await yieldProvider.buildWithdrawIxs({ owner: walletAddress, amount, connection });

        const tx = new Transaction().add(...ixs);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletAddress;

        const signed = await provider.wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        return sig;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [provider, connection, walletAddress, yieldProvider, providerId],
  );

  const deposit = useCallback((amount: bigint) => run("deposit", amount), [run]);
  const withdraw = useCallback((amount: bigint) => run("withdraw", amount), [run]);

  return { deposit, withdraw, loading, error };
}
