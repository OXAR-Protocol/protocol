"use client";

import { parseTransactionError } from "@/lib/errors";
import { useCallback, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useOxarProgram } from "./use-oxar-program";
import { deriveMintPda } from "@/lib/pda";

export function useTransferTokens() {
  const { program, walletAddress, connection } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transfer = useCallback(
    async (vaultPda: PublicKey, recipient: PublicKey, amount: BN) => {
      if (!program || !walletAddress || !connection) {
        setError("Wallet not connected");
        return null;
      }

      if (recipient.equals(walletAddress)) {
        setError("Cannot send to your own wallet");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const [vaultTokenMint] = deriveMintPda(vaultPda);

        const senderVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress,
        );
        const recipientVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          recipient,
        );

        const recipientAccountInfo = await connection.getAccountInfo(
          recipientVaultToken,
        );

        const transferIx = await program.methods
          .transferTokens(amount)
          .accounts({
            sender: walletAddress,
            recipient,
            vault: vaultPda,
            vaultTokenMint,
            senderVaultToken,
            recipientVaultToken,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();

        const tx = new Transaction();

        if (!recipientAccountInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              walletAddress,
              recipientVaultToken,
              recipient,
              vaultTokenMint,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
        }

        tx.add(transferIx);

        const latest = await connection.getLatestBlockhash("confirmed");
        tx.recentBlockhash = latest.blockhash;
        tx.feePayer = walletAddress;

        const signed = await program.provider.wallet!.signTransaction(tx);

        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
        });

        const confirmation = await connection.confirmTransaction(
          {
            signature,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
          },
          "confirmed",
        );
        if (confirmation.value.err) {
          throw new Error(
            `Transaction failed: ${JSON.stringify(confirmation.value.err)}`,
          );
        }

        return signature;
      } catch (err: any) {
        console.error("Transfer failed:", err);
        setError(parseTransactionError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, connection],
  );

  return { transfer, loading, error };
}
