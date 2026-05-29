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
import type { BuildIxParams, YieldPosition, YieldProvider } from "./types";

const USDC = new PublicKey(USDC_MINT);

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
    const tokens = await getLendingTokens({ connection });
    for (const lendingToken of tokens) {
      const d = await getLendingTokenDetails({ lendingToken, connection });
      if (d.asset.equals(USDC)) {
        // supplyRate is a fixed-point per-year rate. Scale (1e9) is Jupiter's
        // convention; VERIFY against the live UI before trusting the displayed %.
        return d.supplyRate.toNumber() / 1e9;
      }
    }
    return 0;
  },
};
