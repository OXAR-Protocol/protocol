"use client";

import { useCallback, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useOxarProgram } from "./use-oxar-program";
import { deriveMintPda, derivePoolPda } from "@/lib/pda";

export function useClaim() {
  const { program, walletAddress, connection } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const claim = useCallback(
    async (vaultPda: PublicKey) => {
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

        const claimerVaultToken = await getAssociatedTokenAddress(vaultTokenMint, walletAddress);
        const claimerUsdc = await getAssociatedTokenAddress(usdcMint, walletAddress);

        const ix = await program.methods
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
          .instruction();

        const tx = new Transaction().add(ix);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletAddress;

        const signed = await program.provider.wallet!.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
        

        return signature;
      } catch (err: any) {
        console.error("Claim failed:", err);
        setError(err.message || "Claim failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, connection]
  );

  return { claim, loading, error };
}
