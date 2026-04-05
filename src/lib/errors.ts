/**
 * Parse Solana/Anchor transaction errors into user-friendly messages.
 * Hides internal details (PDA seeds, account addresses, compute units).
 */
export function parseTransactionError(err: any): string {
  const msg = err?.message || err?.toString() || "Transaction failed";

  // Anchor error codes
  if (msg.includes("ConstraintSeeds")) {
    return "This vault is outdated. Please use a newer vault from the Vaults page.";
  }
  if (msg.includes("VaultNotActive")) {
    return "This vault is not active. It may have matured or been closed.";
  }
  if (msg.includes("AlreadyMatured")) {
    return "This bond has already matured. No new deposits or listings allowed.";
  }
  if (msg.includes("NotMatured")) {
    return "This bond has not matured yet. You can sell on the Marketplace instead.";
  }
  if (msg.includes("InsufficientFunds") || msg.includes("Attempt to debit")) {
    return "Insufficient funds. Make sure you have enough USDC and SOL for fees.";
  }
  if (msg.includes("InsufficientTokens")) {
    return "You don't have enough tokens for this operation.";
  }
  if (msg.includes("ZeroDeposit")) {
    return "Deposit amount must be greater than zero.";
  }
  if (msg.includes("ZeroListingAmount") || msg.includes("ZeroListingPrice")) {
    return "Listing amount and price must be greater than zero.";
  }
  if (msg.includes("SelfPurchase")) {
    return "You cannot buy your own listing.";
  }
  if (msg.includes("AccountNotInitialized")) {
    return "Account setup required. Please try again — it will be created automatically.";
  }
  if (msg.includes("Unauthorized")) {
    return "You are not authorized to perform this action.";
  }
  if (msg.includes("VaultNotEmpty")) {
    return "Vault still has outstanding positions. All users must claim first.";
  }
  if (msg.includes("MathOverflow")) {
    return "Amount too large. Please use a smaller value.";
  }

  // Generic Solana errors
  if (msg.includes("Simulation failed")) {
    return "Transaction failed. Please try again or check your balances.";
  }
  if (msg.includes("was not confirmed in")) {
    return "Transaction sent but not confirmed yet. Check your portfolio in a minute.";
  }
  if (msg.includes("blockhash not found")) {
    return "Network is busy. Please try again.";
  }

  // Wallet errors
  if (msg.includes("User rejected")) {
    return "Transaction cancelled.";
  }
  if (msg.includes("Wallet not ready")) {
    return "Wallet is still loading. Please wait a moment and try again.";
  }

  // Fallback — don't expose raw error
  return "Something went wrong. Please try again.";
}
