"use client";

import { useCallback, useState } from "react";
import { PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram } from "@solana/web3.js";
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
  const { program, walletAddress } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createListing = useCallback(
    async (vaultPda: PublicKey, amount: BN, pricePerToken: BN) => {
      if (!program || !walletAddress) {
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

        const tx = await program.methods
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
            rent: SYSVAR_RENT_PUBKEY,
          } as any)
          .rpc();

        return tx;
      } catch (err: any) {
        console.error("Create listing failed:", err);
        setError(err.message || "Create listing failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress]
  );

  return { createListing, loading, error };
}
