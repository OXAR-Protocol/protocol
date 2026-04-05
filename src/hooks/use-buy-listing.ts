"use client";

import { parseTransactionError } from "@/lib/errors";
import { useCallback, useState } from "react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { useOxarProgram } from "./use-oxar-program";
import {
  deriveMintPda,
  deriveListingPda,
  deriveEscrowPda,
} from "@/lib/pda";

export function useBuyListing() {
  const { program, walletAddress, connection } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buyListing = useCallback(
    async (vaultPda: PublicKey, sellerPubkey: PublicKey) => {
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
        const [listing] = deriveListingPda(vaultPda, sellerPubkey);
        const [escrowTokenAccount] = deriveEscrowPda(vaultPda, sellerPubkey);

        const buyerUsdc = await getAssociatedTokenAddress(usdcMint, walletAddress);
        const sellerUsdc = await getAssociatedTokenAddress(usdcMint, sellerPubkey);
        const treasuryUsdc = await getAssociatedTokenAddress(usdcMint, vaultAccount.treasury as PublicKey);
        const buyerVaultToken = await getAssociatedTokenAddress(vaultTokenMint, walletAddress);

        const ix = await program.methods
          .buyListing()
          .accounts({
            buyer: walletAddress,
            seller: sellerPubkey,
            vault: vaultPda,
            listing,
            vaultTokenMint,
            buyerUsdc,
            sellerUsdc,
            treasuryUsdc,
            buyerVaultToken,
            escrowTokenAccount,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();

        const tx = new Transaction();

        // Create missing ATAs
        for (const [ata, owner] of [
          [buyerUsdc, walletAddress],
          [sellerUsdc, sellerPubkey],
          [treasuryUsdc, vaultAccount.treasury as PublicKey],
        ] as [PublicKey, PublicKey][]) {
          const info = await connection.getAccountInfo(ata);
          if (!info) {
            tx.add(createAssociatedTokenAccountInstruction(
              walletAddress, ata, owner, usdcMint,
              TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
            ));
          }
        }

        // Create buyer vault token ATA if needed
        const buyerVaultTokenInfo = await connection.getAccountInfo(buyerVaultToken);
        if (!buyerVaultTokenInfo) {
          tx.add(createAssociatedTokenAccountInstruction(
            walletAddress, buyerVaultToken, walletAddress, vaultTokenMint,
            TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID,
          ));
        }

        tx.add(ix);
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletAddress;

        const signed = await program.provider.wallet!.signTransaction(tx);
        const signature = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
        

        return signature;
      } catch (err: any) {
        console.error("Buy listing failed:", err);
        setError(parseTransactionError(err));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, connection]
  );

  return { buyListing, loading, error };
}
