"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import { useOxarProgram } from "./use-oxar-program";
import { useVaults, VaultAccount } from "./use-vaults";

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
  const { vaults } = useVaults();
  const [usdcBalance, setUsdcBalance] = useState<BN>(new BN(0));
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPortfolio = useCallback(async () => {
    if (!walletAddress) {
      setUsdcBalance(new BN(0));
      setPositions([]);
      setTokenBalances([]);
      setLoading(false);
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

      // Match balances with known vaults
      const matchedPositions: PortfolioPosition[] = [];
      for (const vault of vaults) {
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

      // Try to find USDC balance (look for vault's usdcMint)
      if (vaults.length > 0) {
        const usdcMint = vaults[0].account.usdcMint;
        const usdcBal = balances.find(
          (b) => b.mint.toBase58() === usdcMint.toBase58()
        );
        setUsdcBalance(usdcBal?.balance || new BN(0));
      }
    } catch (err) {
      console.error("Failed to fetch portfolio:", err);
    } finally {
      setLoading(false);
    }
  }, [connection, walletAddress, vaults]);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  return { usdcBalance, positions, tokenBalances, loading, refetch: fetchPortfolio };
}
