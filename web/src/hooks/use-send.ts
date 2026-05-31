"use client";

import { useCallback, useState } from "react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";

import { useSolanaContext } from "@/providers/solana-provider";
import { toFriendlyError, UserFacingError } from "@/lib/yield";
import type { WalletAsset } from "@/lib/portfolio/assets";
import { getSwapQuote, buildSwapTx, priceImpactTooHigh } from "@/lib/swap/jupiter-swap";
import { DELORA_SOLANA_CHAIN_ID, bridgeFeeTooHigh, type BridgeQuote } from "@/lib/bridge/delora";
import type { DestChain, DestAsset } from "@/lib/wallet/outbound-destinations";

export type SendStatus = "idle" | "sending";
export interface SendResult {
  sig: string;
  /** Funds bridged to another chain (arrival takes ~a minute). */
  crossChain: boolean;
}

const deserialize = (b64: string) =>
  VersionedTransaction.deserialize(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));

/**
 * Withdraw your USDC into any asset, anywhere: same-asset Solana transfer, a
 * Jupiter swap into another Solana asset (e.g. SOL), or a Delora bridge to USDC /
 * native on an EVM chain. The active Solana wallet signs + pays the SOL fee.
 */
export function useSend() {
  const { wallet, walletAddress, connection } = useSolanaContext();
  const [status, setStatus] = useState<SendStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const sendVersioned = useCallback(
    async (tx: VersionedTransaction): Promise<string> => {
      const signed = await wallet!.signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [wallet, connection],
  );

  const send = useCallback(
    async (params: {
      source: WalletAsset;
      destChain: DestChain;
      destAsset: DestAsset;
      to: string;
      amountBase: bigint;
    }): Promise<SendResult> => {
      const { source, destChain, destAsset, to, amountBase } = params;
      if (!wallet || !walletAddress) throw new Error("Wallet not connected");
      const owner = walletAddress.toBase58();

      setError(null);
      setStatus("sending");
      try {
        if (destAsset.kind === "bridge") {
          if (!destChain.chainId) throw new UserFacingError("Unsupported destination chain");
          const res = await fetch("/api/bridge-quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              senderAddress: owner,
              originChainId: DELORA_SOLANA_CHAIN_ID,
              destinationChainId: destChain.chainId,
              amount: amountBase.toString(),
              originCurrency: source.mint,
              destinationCurrency: destAsset.mint,
              receiverAddress: to.trim(),
            }),
          });
          const quote = (await res.json()) as BridgeQuote & { error?: string };
          if (!res.ok) throw new UserFacingError(quote.error || "No route to that chain");
          if (bridgeFeeTooHigh(quote, Number(amountBase) / 10 ** source.decimals)) {
            throw new UserFacingError("Fees are too high for this amount — try a larger amount.");
          }
          // SVM origin: calldata.data is a base64 Solana transaction.
          return { sig: await sendVersioned(deserialize(quote.calldata.data)), crossChain: true };
        }

        if (destAsset.kind === "swap") {
          const quote = await getSwapQuote({ inputMint: source.mint, outputMint: destAsset.mint, amount: amountBase });
          if (priceImpactTooHigh(quote)) throw new UserFacingError("Price impact too high — try a smaller amount");
          return { sig: await sendVersioned(deserialize(await buildSwapTx(quote, owner))), crossChain: false };
        }

        // transfer: same-asset SPL transfer to the address.
        const toPubkey = new PublicKey(to.trim());
        const mint = new PublicKey(source.mint);
        const fromAta = await getAssociatedTokenAddress(mint, walletAddress);
        const toAta = await getAssociatedTokenAddress(mint, toPubkey);
        const tx = new Transaction().add(
          createAssociatedTokenAccountIdempotentInstruction(walletAddress, toAta, toPubkey, mint),
          createTransferInstruction(fromAta, toAta, walletAddress, amountBase),
        );
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
    [wallet, walletAddress, connection, sendVersioned],
  );

  return { send, status, error };
}
