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

/** External (user-owned) wallet vs the built-in Privy embedded one. */
const isExternalClient = (clientType: string | undefined): boolean =>
  !!clientType && clientType !== "privy";

/**
 * True if the user has linked an EXTERNAL Solana wallet (Phantom/Solflare/…), i.e.
 * they signed in with their own wallet. Used to suppress embedded-wallet creation:
 * under the v2 model the account is the login wallet, so a wallet-login user must
 * NOT get a second, empty embedded wallet (see
 * docs/plans/2026-06-01-wallet-payment-architecture-v2.md). An EVM wallet linked
 * only to pay (bridge rail) does NOT count — it's a source, not the account.
 */
export function hasExternalSolanaWallet(linked: LinkedAccountLike[]): boolean {
  return linked.some(
    (a) => a.type === "wallet" && a.chainType === "solana" && isExternalClient(a.walletClientType),
  );
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
      const isExternal = isExternalClient(a.walletClientType);
      return { address: a.address as string, label: labelFor(a.walletClientType, isExternal), isExternal };
    });

  if (options.length === 0) return { active: null, options };

  const overrideValid = override && options.some((o) => o.address === override);
  if (overrideValid) return { active: override, options };

  // v2: the account is the wallet you logged in with. The embedded wallet only
  // exists for email/no-wallet users (createOnLogin: users-without-wallets), and
  // for them it IS the account — so prefer it when present; a wallet-login user
  // has no embedded, so their external wallet is the only option and is picked.
  // (see docs/plans/2026-06-01-wallet-payment-architecture-v2.md)
  const preferred = options.find((o) => !o.isExternal) ?? options[0];
  return { active: preferred.address, options };
}
