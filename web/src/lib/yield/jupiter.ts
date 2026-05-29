import { Connection, PublicKey, type TransactionInstruction } from "@solana/web3.js";
import BN from "bn.js";
import {
  getDepositIxs,
  getWithdrawIxs,
  getUserLendingPositionByAsset,
  getLendingTokens,
  getLendingTokenDetails,
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

  async getApy(connection: Connection): Promise<number> {
    // APY is global (not per-wallet) and barely moves — cache it (30s TTL) so
    // navigating between pages that mount useYieldPositions doesn't refetch.
    const cached = getCached<number>(APY_CACHE_KEY);
    if (cached !== null) return cached;

    // Fetch every lending token's details in parallel, then pick USDC — the SDK
    // exposes the asset only on the details, so we can't filter before fetching.
    const tokens = await getLendingTokens({ connection });
    const details = await Promise.all(
      tokens.map((lendingToken) => getLendingTokenDetails({ lendingToken, connection })),
    );
    const usdc = details.find((d) => d.asset.equals(USDC));
    // supplyRate + rewardsRate are in basis points — verified against jup.ag's
    // API for USDC: 422 + 114 = 536 = 5.36% total APY. /10000 → fraction.
    const apy = usdc
      ? (usdc.supplyRate.toNumber() + usdc.rewardsRate.toNumber()) / 10000
      : 0;
    if (apy > 0) setCache(APY_CACHE_KEY, apy);
    return apy;
  },
};
