"use client";

import { useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useOxarProgram } from "./use-oxar-program";
import { deriveMintPda, derivePoolPda } from "@/lib/pda";

export function useClaim() {
  const { program, walletAddress } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claim = useCallback(
    async (vaultPda: PublicKey) => {
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
        const [usdcPool] = derivePoolPda(vaultPda);

        const claimerVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress
        );
        const claimerUsdc = await getAssociatedTokenAddress(
          usdcMint,
          walletAddress
        );

        const tx = await program.methods
          .claim()
          .accounts({
            claimer: walletAddress,
            vault: vaultPda,
            vaultTokenMint,
            claimerVaultToken,
            claimerUsdc,
            usdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .rpc();

        return tx;
      } catch (err: any) {
        console.error("Claim failed:", err);
        setError(err.message || "Claim failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress]
  );

  return { claim, loading, error };
}
