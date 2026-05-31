/**
 * Pick the active Solana wallet from the user's Privy-linked accounts. A user can
 * have BOTH a built-in (embedded) wallet and an external one (Phantom). Choosing
 * the active one consistently — for balances, positions AND the bridge receiver —
 * is what prevents funds landing in a wallet the app isn't showing.
 */
export interface SolanaWalletOption {
  address: string;
  label: string;
  /** External (Phantom/Solflare/…) vs the built-in Privy embedded wallet. */
  isExternal: boolean;
}

// SAFETY: Privy linkedAccounts is loosely typed; we read type/chainType/address/walletClientType.
interface LinkedAccountLike {
  type?: string;
  chainType?: string;
  address?: string;
  walletClientType?: string;
}

function labelFor(clientType: string | undefined, isExternal: boolean): string {
  if (!isExternal) return "Built-in wallet";
  if (!clientType) return "External wallet";
  return clientType.charAt(0).toUpperCase() + clientType.slice(1);
}

/**
 * Returns the selectable Solana wallets and the active address.
 * Active = the user's explicit `override` (if still linked), else a connected
 * external wallet (funds usually live there), else the first wallet.
 */
export function deriveSolanaWallets(
  linked: LinkedAccountLike[],
  override: string | null,
): { active: string | null; options: SolanaWalletOption[] } {
  const options: SolanaWalletOption[] = linked
    .filter((a) => a.type === "wallet" && a.chainType === "solana" && a.address)
    .map((a) => {
      const isExternal = !!a.walletClientType && a.walletClientType !== "privy";
      return { address: a.address as string, label: labelFor(a.walletClientType, isExternal), isExternal };
    });

  if (options.length === 0) return { active: null, options };

  const overrideValid = override && options.some((o) => o.address === override);
  if (overrideValid) return { active: override, options };

  // Standard: the account is the built-in (embedded) wallet. External wallets are
  // funding rails, not the account — so prefer the embedded one. (see
  // docs/plans/2026-06-01-wallet-account-standard.md)
  const preferred = options.find((o) => !o.isExternal) ?? options[0];
  return { active: preferred.address, options };
}
