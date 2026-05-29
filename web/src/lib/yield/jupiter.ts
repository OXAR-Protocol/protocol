import { Connection, PublicKey, type TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import {
  getDepositIxs,
  getWithdrawIxs,
  getUserLendingPositionByAsset,
} from "@jup-ag/lend/earn";

import { USDC_MINT, USDC_DECIMALS } from "@/lib/constants";
import { getCached, setCache } from "@/lib/cache";
import type { BuildIxParams, YieldPosition, YieldProvider } from "./types";

const USDC = new PublicKey(USDC_MINT);
const APY_CACHE_KEY = "jupiter-lend-usdc:apy";

/**
 * Jupiter Lend "Earn" provider. Funds go directly into Jupiter Lend; the user
 * holds their own lending position. We only build instructions — the wallet signs.
 * Program: jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9
 */
export const jupiterUsdcProvider: YieldProvider = {
  id: "jupiter-lend-usdc",
  name: "Jupiter Lend",
  asset: USDC,
  assetSymbol: "USDC",
  decimals: USDC_DECIMALS,
  description: "USDC lending on Solana · withdraw anytime",
  riskLevel: "low",
  chain: "solana",

  async buildDepositIxs({ owner, amount, connection }: BuildIxParams) {
    const { ixs } = await getDepositIxs({
      amount: new BN(amount.toString()),
      asset: USDC,
      signer: owner,
      connection,
    });
    return ixs as TransactionInstruction[];
  },

  async buildWithdrawIxs({ owner, amount, connection }: BuildIxParams) {
    const { ixs } = await getWithdrawIxs({
      amount: new BN(amount.toString()),
      asset: USDC,
      signer: owner,
      connection,
    });
    return ixs as TransactionInstruction[];
  },

  async getPosition(owner: PublicKey, connection: Connection): Promise<YieldPosition> {
    try {
      const pos = await getUserLendingPositionByAsset({ user: owner, asset: USDC, connection });
      return {
        underlyingBalance: BigInt(pos.underlyingBalance.toString()),
        shares: BigInt(pos.lendingTokenShares.toString()),
      };
    } catch {
      // No position yet (account not found) → zeroed.
      return { underlyingBalance: BigInt(0), shares: BigInt(0) };
    }
  },

  async getApy(): Promise<number> {
    // APY is global (not per-wallet) and barely moves — cache it (30s TTL).
    const cached = getCached<number>(APY_CACHE_KEY);
    if (cached !== null) return cached;

    // Read APY from Jupiter's public REST API (one CORS-friendly GET) rather than
    // enumerating program accounts on-chain — getProgramAccounts is heavy and gets
    // rate-limited in-browser (the on-chain path silently returned 0). totalRate
    // = supplyRate + rewardsRate in basis points (USDC 422 + 114 = 536 = 5.36%).
    const res = await fetch("https://lite-api.jup.ag/lend/v1/earn/tokens");
    if (!res.ok) return 0;
    const tokens: Array<{ assetAddress: string; totalRate: string }> = await res.json();
    const usdc = tokens.find((t) => t.assetAddress === USDC_MINT);
    const apy = usdc ? Number(usdc.totalRate) / 10000 : 0;
    if (apy > 0) setCache(APY_CACHE_KEY, apy);
    return apy;
  },
};
