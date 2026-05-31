"use client";

import { useCallback, useState } from "react";
import { PublicKey, Transaction, SystemProgram, VersionedTransaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

import { useSolanaContext } from "@/providers/solana-provider";
import { toFriendlyError, UserFacingError } from "@/lib/yield";
import { SOL_MINT, type WalletAsset } from "@/lib/portfolio/assets";
import { DELORA_SOLANA_CHAIN_ID, bridgeFeeTooHigh, type BridgeQuote } from "@/lib/bridge/delora";
import type { DestChain } from "@/lib/wallet/outbound-destinations";

export type SendStatus = "idle" | "sending";
export interface SendResult {
  sig: string;
  /** True when funds were bridged to another chain (arrival takes a bit). */
  crossChain: boolean;
}

/**
 * Outbound transfer: send a held asset to any address, on Solana (plain transfer)
 * or cross-chain to an EVM chain (Delora bridge → USDC there). The active Solana
 * wallet signs + pays the SOL fee; the EVM recipient needs no gas to receive.
 */
export function useSend() {
  const { wallet, walletAddress, connection } = useSolanaContext();
  const [status, setStatus] = useState<SendStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (params: { asset: WalletAsset; dest: DestChain; to: string; amountBase: bigint }): Promise<SendResult> => {
      const { asset, dest, to, amountBase } = params;
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");

      setError(null);
      setStatus("sending");
      try {
        // Cross-chain: bridge to USDC on the chosen EVM chain via Delora.
        if (dest.chain === "ethereum") {
          if (!dest.chainId) throw new UserFacingError("Unsupported destination chain");
          const res = await fetch("/api/bridge-quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderAddress: walletAddress.toBase58(),
              originChainId: DELORA_SOLANA_CHAIN_ID,
              destinationChainId: dest.chainId,
              amount: amountBase.toString(),
              originCurrency: asset.mint,
              destinationCurrency: dest.usdc,
              receiverAddress: to.trim(),
            }),
          });
          const quote = (await res.json()) as BridgeQuote & { error?: string };
          if (!res.ok) throw new UserFacingError(quote.error || "No route to that chain");
          const usd = Number(amountBase) / 10 ** asset.decimals;
          if (bridgeFeeTooHigh(quote, usd)) {
            throw new UserFacingError("Fees are too high for this amount — try a larger amount.");
          }
          // SVM origin: calldata.data is a base64 Solana transaction — sign + send it.
          const tx = VersionedTransaction.deserialize(
            Uint8Array.from(atob(quote.calldata.data), (c) => c.charCodeAt(0)),
          );
          const signed = await wallet.signTransaction(tx);
          const sig = await connection.sendRawTransaction(signed.serialize());
          await connection.confirmTransaction(sig, "confirmed");
          return { sig, crossChain: true };
        }

        // Same-chain (Solana) transfer.
        const toPubkey = new PublicKey(to.trim());
        const tx = new Transaction();
        if (asset.mint === SOL_MINT) {
          tx.add(SystemProgram.transfer({ fromPubkey: walletAddress, toPubkey, lamports: amountBase }));
        } else {
          const mint = new PublicKey(asset.mint);
          const fromAta = await getAssociatedTokenAddress(mint, walletAddress);
          const toAta = await getAssociatedTokenAddress(mint, toPubkey);
          tx.add(
            createAssociatedTokenAccountIdempotentInstruction(walletAddress, toAta, toPubkey, mint),
            createTransferInstruction(fromAta, toAta, walletAddress, amountBase),
          );
        }
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletAddress;
        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize());
        await connection.confirmTransaction(sig, "confirmed");
        return { sig, crossChain: false };
      } catch (e) {
        console.error("Send failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [wallet, walletAddress, connection],
  );

  return { send, status, error };
}
