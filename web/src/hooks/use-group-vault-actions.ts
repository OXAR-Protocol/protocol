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
  deriveGroupVaultPda,
  deriveGroupMemberPda,
  derivePersonalVaultPda,
  deriveMintPda,
  derivePoolPda,
} from "@oxar/sdk";
import { CURRENT_USDC_MINT } from "@/lib/constants";

import { useOxarProgram } from "./use-oxar-program";

const DEFAULT_FEE_BPS = 1000; // 10%

// Risk template variant for Anchor IDL
type RiskVariant =
  | { conservative: {} }
  | { balanced: {} }
  | { aggressive: {} };

const RISK_VARIANT: Record<string, RiskVariant> = {
  conservative: { conservative: {} },
  balanced: { balanced: {} },
  aggressive: { aggressive: {} },
};

export interface CreateGroupParams {
  name: string;
  goalAmount: number; // USDC
  goalDeadline: number; // unix timestamp (0 = no deadline)
  inviteCode: Uint8Array; // 32 bytes
  riskTemplate: keyof typeof RISK_VARIANT;
  initialDeposit: number; // USDC
  displayName: string;
}

// Hash function for invite_code → invite_hash (SHA-256)
async function sha256(data: Uint8Array): Promise<Uint8Array> {
  // Copy to a fresh ArrayBuffer to satisfy strict typing
  const ab = new ArrayBuffer(data.byteLength);
  new Uint8Array(ab).set(data);
  const buf = await crypto.subtle.digest("SHA-256", ab);
  return new Uint8Array(buf);
}

export function useGroupVaultActions() {
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

  /**
   * Create a group vault. Returns { groupVaultPda, signature } on success.
   *
   * This is a 2-step process under the hood:
   * 1. initialize_group_vault (creates GroupVault, backing Vault, Mint, Pool)
   * 2. join_group_vault (creator joins as first member with initial deposit)
   */
  const createGroup = useCallback(
    async (
      params: CreateGroupParams,
    ): Promise<{ groupVaultPda: PublicKey; signature: string } | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        // Group vault ID: ms timestamp shifted up + 16-bit random nonce. Two
        // creates in the same millisecond (let alone same second) get distinct
        // PDAs, even when triggered programmatically.
        const ms = BigInt(Date.now());
        const nonce = BigInt(Math.floor(Math.random() * 0x10000));
        const vaultIdBig = (ms * BigInt(0x10000)) + nonce;
        const vaultId = new BN(vaultIdBig.toString());

        const [groupVaultPda] = deriveGroupVaultPda(walletAddress, vaultIdBig);

        // Backing vault PDA: ["vault", group_vault_pda, vault_id]
        const [vaultPda] = derivePersonalVaultPda(groupVaultPda, vaultIdBig);
        const [vaultTokenMint] = deriveMintPda(vaultPda);
        const [usdcPool] = derivePoolPda(vaultPda);
        const usdcMint = new PublicKey(CURRENT_USDC_MINT);

        const inviteHash = await sha256(params.inviteCode);

        // Step 1: initialize_group_vault
        const initIx = await program.methods
          .initializeGroupVault({
            vaultId,
            name: params.name,
            goalAmount: new BN(Math.floor(params.goalAmount * 1_000_000)),
            goalDeadline: new BN(params.goalDeadline),
            inviteHash: Array.from(inviteHash),
            riskTemplate: RISK_VARIANT[params.riskTemplate] as any,
            feeBps: DEFAULT_FEE_BPS,
          } as any)
          .accounts({
            creator: walletAddress,
            groupVault: groupVaultPda,
            vault: vaultPda,
            usdcMint,
            vaultTokenMint,
            usdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
            rent: SYSVAR_RENT_PUBKEY,
          } as any)
          .instruction();

        // Prepare member ATAs (vault token + USDC)
        const memberUsdc = await getAssociatedTokenAddress(
          usdcMint,
          walletAddress,
        );
        const memberVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress,
        );
        const [groupMemberPda] = deriveGroupMemberPda(
          groupVaultPda,
          walletAddress,
        );

        const tx = new Transaction().add(initIx);

        // Create vault token ATA if needed
        const vaultTokenAtaInfo =
          await connection.getAccountInfo(memberVaultToken);
        if (!vaultTokenAtaInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              walletAddress,
              memberVaultToken,
              walletAddress,
              vaultTokenMint,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
        }

        // Step 2: join_group_vault (creator's initial deposit)
        const joinIx = await program.methods
          .joinGroupVault({
            inviteCode: Array.from(params.inviteCode),
            initialDeposit: new BN(
              Math.floor(params.initialDeposit * 1_000_000),
            ),
            displayName: params.displayName,
          } as any)
          .accounts({
            member: walletAddress,
            groupVault: groupVaultPda,
            vault: vaultPda,
            groupMember: groupMemberPda,
            vaultTokenMint,
            memberUsdc,
            memberVaultToken,
            usdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        tx.add(joinIx);

        const signature = await send(tx);
        return { groupVaultPda, signature };
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to create group";
        console.error("createGroup error:", err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, connection, send],
  );

  /** Join an existing group by invite_code. */
  const joinGroup = useCallback(
    async (
      groupVaultPda: PublicKey,
      vault: PublicKey,
      inviteCode: Uint8Array,
      initialDeposit: number,
      displayName: string,
    ): Promise<string | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const [vaultTokenMint] = deriveMintPda(vault);
        const [usdcPool] = derivePoolPda(vault);
        const usdcMint = new PublicKey(CURRENT_USDC_MINT);
        const [groupMemberPda] = deriveGroupMemberPda(
          groupVaultPda,
          walletAddress,
        );

        const memberUsdc = await getAssociatedTokenAddress(
          usdcMint,
          walletAddress,
        );
        const memberVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress,
        );

        const tx = new Transaction();
        const vaultTokenAtaInfo =
          await connection.getAccountInfo(memberVaultToken);
        if (!vaultTokenAtaInfo) {
          tx.add(
            createAssociatedTokenAccountInstruction(
              walletAddress,
              memberVaultToken,
              walletAddress,
              vaultTokenMint,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID,
            ),
          );
        }

        const ix = await program.methods
          .joinGroupVault({
            inviteCode: Array.from(inviteCode),
            initialDeposit: new BN(Math.floor(initialDeposit * 1_000_000)),
            displayName,
          } as any)
          .accounts({
            member: walletAddress,
            groupVault: groupVaultPda,
            vault,
            groupMember: groupMemberPda,
            vaultTokenMint,
            memberUsdc,
            memberVaultToken,
            usdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          } as any)
          .instruction();

        tx.add(ix);
        return await send(tx);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to join";
        console.error("joinGroup error:", err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, connection, send],
  );

  /** Additional deposit into a group vault. */
  const depositToGroup = useCallback(
    async (
      groupVaultPda: PublicKey,
      vault: PublicKey,
      amount: number,
    ): Promise<string | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const [vaultTokenMint] = deriveMintPda(vault);
        const [usdcPool] = derivePoolPda(vault);
        const usdcMint = new PublicKey(CURRENT_USDC_MINT);
        const [groupMemberPda] = deriveGroupMemberPda(
          groupVaultPda,
          walletAddress,
        );

        const memberUsdc = await getAssociatedTokenAddress(
          usdcMint,
          walletAddress,
        );
        const memberVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress,
        );

        const ix = await program.methods
          .groupDeposit(new BN(Math.floor(amount * 1_000_000)))
          .accounts({
            member: walletAddress,
            groupVault: groupVaultPda,
            vault,
            groupMember: groupMemberPda,
            vaultTokenMint,
            memberUsdc,
            memberVaultToken,
            usdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        return await send(tx);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Deposit failed";
        console.error("depositToGroup error:", err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, send],
  );

  /** Withdraw shares from a group vault (pro-rata USDC). */
  const withdrawFromGroup = useCallback(
    async (
      groupVaultPda: PublicKey,
      vault: PublicKey,
      shares: BN,
    ): Promise<string | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const [vaultTokenMint] = deriveMintPda(vault);
        const [usdcPool] = derivePoolPda(vault);
        const usdcMint = new PublicKey(CURRENT_USDC_MINT);
        const [groupMemberPda] = deriveGroupMemberPda(
          groupVaultPda,
          walletAddress,
        );

        const memberUsdc = await getAssociatedTokenAddress(
          usdcMint,
          walletAddress,
        );
        const memberVaultToken = await getAssociatedTokenAddress(
          vaultTokenMint,
          walletAddress,
        );

        const ix = await program.methods
          .groupWithdraw(shares)
          .accounts({
            member: walletAddress,
            groupVault: groupVaultPda,
            vault,
            groupMember: groupMemberPda,
            vaultTokenMint,
            memberVaultToken,
            memberUsdc,
            usdcPool,
            tokenProgram: TOKEN_PROGRAM_ID,
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        return await send(tx);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Withdraw failed";
        console.error("withdrawFromGroup error:", err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, send],
  );

  /** Close GroupMember account (must have 0 shares first). Refunds rent. */
  const leaveGroup = useCallback(
    async (groupVaultPda: PublicKey): Promise<string | null> => {
      if (!program || !walletAddress) {
        setError("Wallet not connected");
        return null;
      }
      setLoading(true);
      setError(null);
      try {
        const [groupMemberPda] = deriveGroupMemberPda(
          groupVaultPda,
          walletAddress,
        );

        const ix = await program.methods
          .leaveGroupVault()
          .accounts({
            member: walletAddress,
            groupVault: groupVaultPda,
            groupMember: groupMemberPda,
          } as any)
          .instruction();

        const tx = new Transaction().add(ix);
        return await send(tx);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Leave failed";
        console.error("leaveGroup error:", err);
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [program, walletAddress, send],
  );

  return {
    createGroup,
    joinGroup,
    depositToGroup,
    withdrawFromGroup,
    leaveGroup,
    loading,
    error,
  };
}

/** Generate a random 32-byte invite code. */
export function generateInviteCode(): Uint8Array {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return arr;
}

/** Encode invite code as base64url for sharing in URL. */
export function encodeInviteCode(code: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...code));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Decode base64url invite code from URL. */
export function decodeInviteCode(encoded: string): Uint8Array {
  const b64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "===".slice((b64.length + 3) % 4);
  const bin = atob(padded);
  const arr = new Uint8Array(32);
  for (let i = 0; i < 32; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
