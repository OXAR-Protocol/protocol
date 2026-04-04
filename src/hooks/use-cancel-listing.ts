"use client";

import { useCallback, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
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

export function useCancelListing() {
  const { program, walletAddress, connection } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelListing = useCallback(
    async (vaultPda: PublicKey) => {
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
          .cancelListing()
          .accounts({
            seller: walletAddress,
            vault: vaultPda,
            listing,
            vaultTokenMint,
            sellerVaultToken,
            escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletAddress;

        const signed = await program.provider.wallet!.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
        

        return signature;
      } catch (err: any) {
        console.error("Cancel listing failed:", err);
        setError(err.message || "Cancel listing failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, connection]
  );

  return { cancelListing, loading, error };
}
