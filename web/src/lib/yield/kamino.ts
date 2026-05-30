import { PublicKey, VersionedTransaction } from "@solana/web3.js";

import { USDC_MINT, USDC_DECIMALS } from "@/lib/constants";
import type {
  BuildIxParams,
  RedeemTxParams,
  YieldPosition,
  YieldProvider,
} from "./types";

/**
 * Kamino Lend provider. klend's SDK is Node-only and heavy (kit v2 + WASM), so the
 * actual transaction is built SERVER-SIDE (`/api/kamino`); the client only fetches
 * the unsigned v0 transaction and hands it to the Privy wallet to sign+send.
 */
const USDC = new PublicKey(USDC_MINT);

async function postKamino<T>(body: Record<string, unknown>): Promise<T> {
  const res = await fetch("/api/kamino", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(data?.error || "Kamino request failed");
  return data;
}

/** base64 wire bytes → v1 VersionedTransaction (browser-safe, no Buffer). */
function deserializeTx(b64: string): VersionedTransaction {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return VersionedTransaction.deserialize(bytes);
}

export const kaminoUsdcProvider: YieldProvider = {
  id: "kamino-lend-usdc",
  name: "Kamino Lend",
  asset: USDC,
  assetSymbol: "USDC",
  decimals: USDC_DECIMALS,
  description: "USDC lending on Kamino · withdraw anytime",
  riskLevel: "low",
  chain: "solana",

  async buildDepositTx({ owner, amount }: BuildIxParams) {
    const { tx } = await postKamino<{ tx: string }>({
      action: "deposit-tx",
      owner: owner.toBase58(),
      amount: amount.toString(),
    });
    return deserializeTx(tx);
  },

  async buildWithdrawTx({ owner, amount }: BuildIxParams) {
    const { tx } = await postKamino<{ tx: string }>({
      action: "withdraw-tx",
      owner: owner.toBase58(),
      amount: amount.toString(),
      max: false,
    });
    return deserializeTx(tx);
  },

  async buildRedeemTx({ owner }: RedeemTxParams) {
    const { tx } = await postKamino<{ tx: string }>({
      action: "withdraw-tx",
      owner: owner.toBase58(),
      max: true,
    });
    return deserializeTx(tx);
  },

  async getPosition(owner: PublicKey): Promise<YieldPosition> {
    try {
      const { underlyingBalance, shares } = await postKamino<{
        underlyingBalance: string;
        shares: string;
      }>({ action: "position", owner: owner.toBase58() });
      return {
        underlyingBalance: BigInt(underlyingBalance || "0"),
        shares: BigInt(shares || "0"),
      };
    } catch {
      return { underlyingBalance: BigInt(0), shares: BigInt(0) };
    }
  },

  async getApy(): Promise<number> {
    try {
      const { apy } = await postKamino<{ apy: number }>({ action: "apy" });
      return Number(apy) || 0;
    } catch {
      return 0;
    }
  },
};
