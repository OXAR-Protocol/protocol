import { Connection, PublicKey, type TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import {
  getDepositIxs,
  getWithdrawIxs,
  getRedeemIxs,
  getUserLendingPositionByAsset,
} from "@jup-ag/lend/earn";

import { USDC_MINT, USDC_DECIMALS } from "@/lib/constants";
import { getCached, setCache } from "@/lib/cache";
import { getProviderApy } from "./yields-api";
import type {
  BuildIxParams,
  RedeemIxParams,
  YieldPosition,
  YieldProvider,
} from "./types";

const TOKENS_URL = "https://lite-api.jup.ag/lend/v1/earn/tokens";
const TOKENS_CACHE_KEY = "jupiter-lend:tokens";

interface JupiterToken {
  assetAddress: string;
  totalRate: string;
}

/**
 * Jupiter Lend `totalRate` (supplyRate + rewardsRate, in basis points as a string)
 * → APY as a fraction (e.g. "530" → 0.053). Returns 0 on missing/invalid input.
 */
export function parseJupiterApy(totalRate: string | undefined): number {
  const bps = Number(totalRate);
  return Number.isFinite(bps) && bps > 0 ? bps / 10000 : 0;
}

/**
 * Fetch the Lend token list once and cache it (30s TTL) — shared by every Jupiter
 * provider so N assets don't trigger N identical REST calls. We read APY from this
 * CORS-friendly GET rather than enumerating program accounts on-chain (heavy /
 * rate-limited in-browser).
 */
async function fetchJupiterLendTokens(): Promise<JupiterToken[]> {
  const cached = getCached<JupiterToken[]>(TOKENS_CACHE_KEY);
  if (cached !== null) return cached;
  const res = await fetch(TOKENS_URL);
  if (!res.ok) return [];
  const tokens = (await res.json()) as JupiterToken[];
  if (Array.isArray(tokens) && tokens.length > 0) setCache(TOKENS_CACHE_KEY, tokens);
  return tokens;
}

export interface JupiterLendConfig {
  /** Stable provider id, e.g. "jupiter-lend-usdt". */
  id: string;
  assetSymbol: string;
  /** Underlying asset mint (base58). */
  assetMint: string;
  decimals: number;
  description: string;
  riskLevel: "low" | "medium" | "high";
  /** DefiLlama pool id (primary, accurate APY source + chart history). */
  defiLlamaPoolId: string;
}

/**
 * Build a Jupiter Lend "Earn" provider for ONE asset. All Jupiter assets share this
 * logic — adding a stablecoin is a config object, not a new file. Funds go directly
 * into Jupiter Lend; the user holds their own position. We only build instructions —
 * the wallet signs. Program: jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9
 */
export function createJupiterLendProvider(config: JupiterLendConfig): YieldProvider {
  const asset = new PublicKey(config.assetMint);

  return {
    id: config.id,
    name: "Jupiter Lend",
    asset,
    assetSymbol: config.assetSymbol,
    decimals: config.decimals,
    description: config.description,
    riskLevel: config.riskLevel,
    chain: "solana",

    async buildDepositIxs({ owner, amount, connection }: BuildIxParams) {
      const { ixs } = await getDepositIxs({
        amount: new BN(amount.toString()),
        asset,
        signer: owner,
        connection,
      });
      return ixs as TransactionInstruction[];
    },

    async buildWithdrawIxs({ owner, amount, connection }: BuildIxParams) {
      const { ixs } = await getWithdrawIxs({
        amount: new BN(amount.toString()),
        asset,
        signer: owner,
        connection,
      });
      return ixs as TransactionInstruction[];
    },

    async buildRedeemIxs({ owner, shares, connection }: RedeemIxParams) {
      const { ixs } = await getRedeemIxs({
        shares: new BN(shares.toString()),
        asset,
        signer: owner,
        connection,
      });
      return ixs as TransactionInstruction[];
    },

    async getPosition(owner: PublicKey, connection: Connection): Promise<YieldPosition> {
      try {
        const pos = await getUserLendingPositionByAsset({ user: owner, asset, connection });
        // `underlyingAssets` is the DEPOSITED position (shares → assets). The SDK's
        // `underlyingBalance` is the user's spot wallet balance — using it wrongly
        // counted un-deposited wallet tokens as a position.
        return {
          underlyingBalance: BigInt(pos.underlyingAssets.toString()),
          shares: BigInt(pos.lendingTokenShares.toString()),
        };
      } catch {
        // No position yet (account not found) → zeroed.
        return { underlyingBalance: BigInt(0), shares: BigInt(0) };
      }
    },

    async getApy(): Promise<number> {
      // Primary: DefiLlama (accurate + uniform with charts). Fall back to Jupiter's
      // own REST so a DefiLlama hiccup never blanks a working card.
      const llama = await getProviderApy(config.defiLlamaPoolId);
      if (llama > 0) return llama;
      const tokens = await fetchJupiterLendTokens();
      const token = tokens.find((t) => t.assetAddress === config.assetMint);
      return parseJupiterApy(token?.totalRate);
    },
  };
}

// --- Configured live providers (mainnet mints) ---

export const jupiterUsdcProvider = createJupiterLendProvider({
  id: "jupiter-lend-usdc",
  assetSymbol: "USDC",
  assetMint: USDC_MINT,
  decimals: USDC_DECIMALS,
  description: "USDC lending on Solana · withdraw anytime",
  riskLevel: "low",
  defiLlamaPoolId: "d783c8df-e2ed-44b4-8317-161ccc1b5f06",
});

export const jupiterUsdtProvider = createJupiterLendProvider({
  id: "jupiter-lend-usdt",
  assetSymbol: "USDT",
  assetMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  decimals: 6,
  description: "USDT lending on Solana · withdraw anytime",
  riskLevel: "low",
  defiLlamaPoolId: "a2fbc7ec-22c2-43fe-aa42-49f854aa940d",
});

export const jupiterUsdgProvider = createJupiterLendProvider({
  id: "jupiter-lend-usdg",
  assetSymbol: "USDG",
  assetMint: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
  decimals: 6,
  description: "USDG · Global Dollar lending on Solana · withdraw anytime",
  riskLevel: "low",
  defiLlamaPoolId: "c4d22a9b-a5e3-414e-92d9-76493e1ab239",
});
