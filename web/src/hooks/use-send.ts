"use client";

import { useCallback, useState } from "react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

import { useSolanaContext } from "@/providers/solana-provider";
import { toFriendlyError } from "@/lib/yield";
import { SOL_MINT, type WalletAsset } from "@/lib/portfolio/assets";

export type SendStatus = "idle" | "sending";

/**
 * Send SOL or any SPL token from the active wallet to any Solana address —
 * the "exit" from the built-in wallet to the user's own. Creates the recipient's
 * token account if needed; the active wallet signs + pays the (SOL) fee.
 */
export function useSend() {
  const { wallet, walletAddress, connection } = useSolanaContext();
  const [status, setStatus] = useState<SendStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (asset: WalletAsset, to: string, amountBase: bigint): Promise<string> => {
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      const toPubkey = new PublicKey(to.trim());

      setError(null);
      setStatus("sending");
      try {
        const tx = new Transaction();
        if (asset.mint === SOL_MINT) {
          tx.add(SystemProgram.transfer({ fromPubkey: walletAddress, toPubkey, lamports: amountBase }));
        } else {
          const mint = new PublicKey(asset.mint);
          const fromAta = await getAssociatedTokenAddress(mint, walletAddress);
          const toAta = await getAssociatedTokenAddress(mint, toPubkey);
          tx.add(
            // Idempotent: no-op if the recipient already has the token account.
            createAssociatedTokenAccountIdempotentInstruction(walletAddress, toAta, toPubkey, mint),
            createTransferInstruction(fromAta, toAta, walletAddress, amountBase),
          );
        }
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletAddress;

        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        return sig;
      } catch (e) {
        console.error("Send failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [wallet, walletAddress, connection],
  );

  return { send, status, error };
}
