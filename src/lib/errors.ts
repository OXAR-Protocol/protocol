import { AnchorError } from "@coral-xyz/anchor";

// Map Anchor error codes → user-facing messages. Covers the protocol's custom errors.
const CODE_MESSAGES: Record<string, string> = {
  ConstraintSeeds: "This vault is outdated. Please use a newer vault from the Vaults page.",
  VaultNotActive: "This vault is not active. It may have matured or been closed.",
  AlreadyMatured: "This bond has already matured. No new deposits or listings allowed.",
  NotMatured: "This bond has not matured yet. You can sell on the Marketplace instead.",
  InsufficientFunds: "Insufficient funds. Make sure you have enough USDC and SOL for fees.",
  InsufficientTokens: "You don't have enough tokens for this operation.",
  ZeroDeposit: "Deposit amount must be greater than zero.",
  ZeroListingAmount: "Listing amount and price must be greater than zero.",
  ZeroListingPrice: "Listing amount and price must be greater than zero.",
  SelfPurchase: "You cannot buy your own listing.",
  AccountNotInitialized: "Account setup required. Please try again — it will be created automatically.",
  Unauthorized: "You are not authorized to perform this action.",
  VaultNotEmpty: "Vault still has outstanding positions. All users must claim first.",
  MathOverflow: "Amount too large. Please use a smaller value.",
};

/**
 * Parse Solana/Anchor transaction errors into user-friendly messages.
 * Prefers structured AnchorError matching, falls back to substring matching on the message.
 * Hides internal details (PDA seeds, account addresses, compute units).
 */
export function parseTransactionError(err: unknown): string {
  if (err instanceof AnchorError) {
    const mapped = CODE_MESSAGES[err.error.errorCode.code];
    if (mapped) return mapped;
  }

  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Transaction failed";

  // Substring fallback — covers errors wrapped by web3.js / SPL before reaching Anchor decoding.
  for (const [code, message] of Object.entries(CODE_MESSAGES)) {
    if (msg.includes(code)) return message;
  }
  if (msg.includes("Attempt to debit")) return CODE_MESSAGES.InsufficientFunds;

  // Generic Solana errors
  if (msg.includes("Simulation failed")) {
    return "Transaction failed. Please try again or check your balances.";
  }
  if (msg.includes("was not confirmed in")) {
    return "Transaction sent but not confirmed yet. Check your portfolio in a minute.";
  }
  if (msg.includes("blockhash not found") || msg.includes("BlockhashNotFound")) {
    return "Network is busy. Please try again.";
  }
  if (msg.includes("Transaction too large")) {
    return "Transaction too large. Please try a smaller amount.";
  }

  // Wallet errors
  if (msg.includes("User rejected")) return "Transaction cancelled.";
  if (msg.includes("Wallet not ready")) {
    return "Wallet is still loading. Please wait a moment and try again.";
  }

  return "Something went wrong. Please try again.";
}
