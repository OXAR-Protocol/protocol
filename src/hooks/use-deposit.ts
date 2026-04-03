"use client";

import { useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { useOxarProgram } from "./use-oxar-program";
import { deriveMintPda, derivePoolPda } from "@/lib/pda";

export function useDeposit() {
  const { program, walletAddress } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deposit = useCallback(
    async (vaultPda: PublicKey, amount: BN) => {
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

        const depositorUsdc = await getAssociatedTokenAddress(
          usdcMint,
          walletAddress
        );
        const depositorVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress
        );

        const tx = await program.methods
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
          .rpc();

        return tx;
      } catch (err: any) {
        console.error("Deposit failed:", err);
        setError(err.message || "Deposit failed");
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress]
  );

  return { deposit, loading, error };
}
