"use client";

import { useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
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

export function useBuyListing() {
  const { program, walletAddress } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyListing = useCallback(
    async (vaultPda: PublicKey, sellerPubkey: PublicKey) => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const vaultAccount = await program.account.vault.fetch(vaultPda);
        const usdcMint = vaultAccount.usdcMint as PublicKey;
        const [vaultTokenMint] = deriveMintPda(vaultPda);
        const [listing] = deriveListingPda(vaultPda, sellerPubkey);
        const [escrowTokenAccount] = deriveEscrowPda(vaultPda, sellerPubkey);

        const buyerUsdc = await getAssociatedTokenAddress(
          usdcMint,
          walletAddress
        );
        const sellerUsdc = await getAssociatedTokenAddress(
          usdcMint,
          sellerPubkey
        );
        const buyerVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress
        );

        const tx = await program.methods
          .buyListing()
          .accounts({
            buyer: walletAddress,
            seller: sellerPubkey,
            vault: vaultPda,
            listing,
            vaultTokenMint,
            buyerUsdc,
            sellerUsdc,
            buyerVaultToken,
            escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .rpc();

        return tx;
      } catch (err: any) {
        console.error("Buy listing failed:", err);
        setError(err.message || "Buy listing failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress]
  );

  return { buyListing, loading, error };
}
