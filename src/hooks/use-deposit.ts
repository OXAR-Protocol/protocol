"use client";

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
import { deriveMintPda, derivePoolPda } from "@/lib/pda";

export function useDeposit() {
  const { program, walletAddress, connection } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(
    async (vaultPda: PublicKey, amount: BN) => {
      if (!program || !walletAddress || !connection) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const vaultAccount = await program.account.vault.fetch(vaultPda);
        const usdcMint = vaultAccount.usdcMint as PublicKey;
        const [vaultTokenMint] = deriveMintPda(vaultPda);
        const [usdcPool] = derivePoolPda(vaultPda);

        const depositorUsdc = await getAssociatedTokenAddress(
          usdcMint,
          walletAddress
        );
        const depositorVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress
        );

        // Check if vault token ATA exists, if not create it
        const vaultTokenAccountInfo = await connection.getAccountInfo(depositorVaultToken);

        // Build deposit instruction
        const depositIx = await program.methods
          .deposit(amount)
          .accounts({
            depositor: walletAddress,
            vault: vaultPda,
            vaultTokenMint,
            depositorUsdc,
            depositorVaultToken,
            usdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();

        // Build transaction
        const tx = new Transaction();

        // Add create ATA instruction if needed
        if (!vaultTokenAccountInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              walletAddress,           // payer
              depositorVaultToken,     // associatedToken
              walletAddress,           // owner
              vaultTokenMint,          // mint
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            )
          );
        }

        tx.add(depositIx);

        // Set blockhash and feePayer
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletAddress;

        // Sign via Privy wallet adapter
        const signed = await program.provider.wallet!.signTransaction(tx);

        // Send via connection
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
        });
        

        return signature;
      } catch (err: any) {
        console.error("Deposit failed:", err);
        setError(err.message || "Deposit failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, connection]
  );

  return { deposit, loading, error };
}
