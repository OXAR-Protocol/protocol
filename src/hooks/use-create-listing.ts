"use client";

import { useCallback, useState } from "react";
import { PublicKey, Transaction, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useOxarProgram } from "./use-oxar-program";
import {
  deriveMintPda,
  deriveListingPda,
  deriveEscrowPda,
} from "@/lib/pda";

export function useCreateListing() {
  const { program, walletAddress, connection } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createListing = useCallback(
    async (vaultPda: PublicKey, amount: BN, pricePerToken: BN) => {
      if (!program || !walletAddress || !connection) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const [vaultTokenMint] = deriveMintPda(vaultPda);
        const [listing] = deriveListingPda(vaultPda, walletAddress);
        const [escrowTokenAccount] = deriveEscrowPda(vaultPda, walletAddress);

        const sellerVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress
        );

        const ix = await program.methods
          .createListing(amount, pricePerToken)
          .accounts({
            seller: walletAddress,
            vault: vaultPda,
            listing,
            vaultTokenMint,
            sellerVaultToken,
            escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletAddress;

        const signed = await program.provider.wallet!.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: true,
        });
        

        return signature;
      } catch (err: any) {
        console.error("Create listing failed:", err);
        setError(err.message || "Create listing failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, connection]
  );

  return { createListing, loading, error };
}
