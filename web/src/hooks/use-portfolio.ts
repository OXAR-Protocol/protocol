"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useOxarProgram } from "./use-oxar-program";
import { useVaults, VaultAccount } from "./use-vaults";
import { CURRENT_USDC_MINT } from "@/lib/constants";

export interface TokenBalance {
  mint: PublicKey;
  balance: BN;
  tokenAccount: PublicKey;
}

export interface PortfolioPosition {
  vault: VaultAccount;
  balance: BN;
  tokenAccount: PublicKey;
}

export function usePortfolio() {
  const { connection, walletAddress } = useOxarProgram();
  const { vaults, loading: vaultsLoading } = useVaults();
  const [usdcBalance, setUsdcBalance] = useState<BN>(new BN(0));
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!walletAddress) {
      setUsdcBalance(new BN(0));
      setPositions([]);
      setTokenBalances([]);
      setLoading(false);
      return;
    }

    // Wait for vaults to load before matching balances. Without this guard
    // we'd race and surface positions=[] on first paint, forcing the user
    // to refresh once vaults arrive.
    if (vaultsLoading) {
      setLoading(true);
      return;
    }

    try {
      const tokenAccounts = await connection.getTokenAccountsByOwner(
        walletAddress,
        { programId: TOKEN_PROGRAM_ID }
      );

      const balances: TokenBalance[] = [];
      for (const { pubkey, account } of tokenAccounts.value) {
        const data = account.data;
        const mint = new PublicKey(data.slice(0, 32));
        const amountBytes = data.slice(64, 72);
        const amount = new BN(amountBytes, "le");
        balances.push({ mint, balance: amount, tokenAccount: pubkey });
      }
      setTokenBalances(balances);

      // Match balances with known active vaults only
      const matchedPositions: PortfolioPosition[] = [];
      for (const vault of vaults.filter(v => v.account.isActive)) {
        const vaultMint = vault.account.vaultTokenMint;
        const tokenBal = balances.find(
          (b) => b.mint.toBase58() === vaultMint.toBase58()
        );
        if (tokenBal && !tokenBal.balance.isZero()) {
          matchedPositions.push({
            vault,
            balance: tokenBal.balance,
            tokenAccount: tokenBal.tokenAccount,
          });
        }
      }
      setPositions(matchedPositions);

      const usdcBal = balances.find(
        (b) => b.mint.toBase58() === CURRENT_USDC_MINT
      );
      setUsdcBalance(usdcBal?.balance || new BN(0));
    } catch (err: any) {
      console.error("Failed to fetch portfolio:", err);
      setError(err.message || "Failed to fetch portfolio");
    } finally {
      setLoading(false);
    }
  }, [connection, walletAddress, vaults, vaultsLoading]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { usdcBalance, positions, tokenBalances, loading, error, refetch: fetchPortfolio };
}
