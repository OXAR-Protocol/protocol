"use client";

import { useCallback, useState } from "react";
import { BN } from "@coral-xyz/anchor";
import {
  PublicKey,
  Transaction,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";

import {
  derivePersonalVaultPda,
  deriveMintPda,
  derivePoolPda,
  vaultIdForYieldSource,
} from "@oxar/sdk";
import { CURRENT_USDC_MINT } from "@/lib/constants";

import { useOxarProgram } from "./use-oxar-program";

const DEFAULT_FEE_BPS = 1000; // 10%

/// On-chain risk_template is now a legacy field — we always send Balanced as a
/// placeholder until the next breaking contract release strips it. UX doesn't
/// expose it anymore; risk is implicit via yield-source choice.
const LEGACY_RISK_PLACEHOLDER = { balanced: {} };

/// Yield-source on-chain variant mapped from the client-side catalog id.
function yieldSourceVariant(yieldSourceId: string): Record<string, unknown> {
  switch (yieldSourceId) {
    case "kamino-usdc":
      return { kaminoUsdc: { pool: PublicKey.default } };
    case "marginfi-usdc":
      return { marginFiUsdc: { bank: PublicKey.default } };
    case "jlp":
      return { jupiterLp: { jlpMint: PublicKey.default } };
    case "maple-solana":
      return { mapleSolana: { pool: PublicKey.default } };
    case "drift-insurance":
      return { driftInsurance: { vault: PublicKey.default } };
    case "ondo-usdy":
    case "mountain-usdm":
    case "openeden-tbill":
    case "sky-sdai":
    case "ethena-susde":
      return { deloraCrossChain: { sourceId: new BN(crossChainSourceId(yieldSourceId)) } };
    default:
      return { idle: {} };
  }
}

function crossChainSourceId(id: string): number {
  // Stable mapping for off-chain Delora source ids. Append-only.
  if (id === "ondo-usdy") return 1;
  if (id === "ethena-susde") return 2;
  if (id === "sky-sdai") return 3;
  if (id === "mountain-usdm") return 4;
  if (id === "openeden-tbill") return 5;
  return 0;
}

export function useVaultActions(yieldSourceId: string) {
  const { program, provider, connection, walletAddress } = useOxarProgram();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (tx: Transaction): Promise<string> => {
      if (!provider || !walletAddress) throw new Error("Wallet not connected");
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = walletAddress;
      const signed = await provider.wallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(signature, "confirmed");
      return signature;
    },
    [provider, connection, walletAddress],
  );

  const vaultAddresses = useCallback(() => {
    if (!walletAddress) return null;
    const vaultIdBig = vaultIdForYieldSource(yieldSourceId);
    const vaultId = new BN(vaultIdBig.toString());
    const [vaultPda] = derivePersonalVaultPda(walletAddress, vaultIdBig);
    const [vaultTokenMint] = deriveMintPda(vaultPda);
    const [usdcPool] = derivePoolPda(vaultPda);
    return { vaultId, vaultPda, vaultTokenMint, usdcPool };
  }, [walletAddress, yieldSourceId]);

  const createVault = useCallback(async (): Promise<string | null> => {
    if (!program || !walletAddress) {
      setError("Wallet not connected");
      return null;
    }
    const addrs = vaultAddresses();
    if (!addrs) return null;
    setLoading(true);
    setError(null);
    try {
      const { vaultId, vaultPda, vaultTokenMint, usdcPool } = addrs;
      const usdcMint = new PublicKey(CURRENT_USDC_MINT);

      const initIx = await program.methods
        .initializePersonalVault({
          vaultId,
          riskTemplate: LEGACY_RISK_PLACEHOLDER as any,
          yieldSource: yieldSourceVariant(yieldSourceId) as any,
          feeBps: DEFAULT_FEE_BPS,
        } as any)
        .accounts({
          creator: walletAddress,
          vault: vaultPda,
          usdcMint,
          vaultTokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        } as any)
        .instruction();

      const setupIx = await program.methods
        .setupVaultPool()
        .accounts({
          authority: walletAddress,
          vault: vaultPda,
          usdcMint,
          usdcPool,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        } as any)
        .instruction();

      const tx = new Transaction().add(initIx, setupIx);
      return await send(tx);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create vault";
      setError(msg);
      console.error("createVault error:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [program, walletAddress, yieldSourceId, vaultAddresses, send]);

  const deposit = useCallback(
    async (amountUsdc: number): Promise<string | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      const addrs = vaultAddresses();
      if (!addrs) return null;
      setLoading(true);
      setError(null);
      try {
        const { vaultPda, vaultTokenMint, usdcPool } = addrs;
        const usdcMint = new PublicKey(CURRENT_USDC_MINT);

        const depositorUsdc = await getAssociatedTokenAddress(usdcMint, walletAddress);
        const depositorVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress,
        );

        const amountLamports = new BN(Math.floor(amountUsdc * 1_000_000));

        const tx = new Transaction();
        const ataInfo = await connection.getAccountInfo(depositorVaultToken);
        if (!ataInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              walletAddress,
              depositorVaultToken,
              walletAddress,
              vaultTokenMint,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
        }

        const depositIx = await program.methods
          .deposit(amountLamports)
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

        tx.add(depositIx);
        return await send(tx);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Deposit failed";
        setError(msg);
        console.error("deposit error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, vaultAddresses, connection, send],
  );

  const withdraw = useCallback(
    async (shares: BN): Promise<string | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      const addrs = vaultAddresses();
      if (!addrs) return null;
      setLoading(true);
      setError(null);
      try {
        const { vaultPda, vaultTokenMint, usdcPool } = addrs;
        const usdcMint = new PublicKey(CURRENT_USDC_MINT);

        const withdrawerVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress,
        );
        const withdrawerUsdc = await getAssociatedTokenAddress(usdcMint, walletAddress);

        const ix = await program.methods
          .withdraw(shares)
          .accounts({
            withdrawer: walletAddress,
            vault: vaultPda,
            vaultTokenMint,
            withdrawerVaultToken,
            withdrawerUsdc,
            usdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        return await send(tx);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Withdraw failed";
        setError(msg);
        console.error("withdraw error:", err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, vaultAddresses, send],
  );

  return { createVault, deposit, withdraw, loading, error };
}
