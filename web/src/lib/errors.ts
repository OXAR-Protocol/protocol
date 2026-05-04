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

// Anchor assigns custom error numbers starting at 6000, in declaration order from
// programs/oxar-protocol/src/error.rs. Mirror that here so we can decode raw Solana
// "Custom":N / "0x{hex}" / "Error Number: N" messages that bypass AnchorError parsing.
const NUMBER_TO_CODE: Record<number, string> = {
  6000: "VaultNotActive",
  6001: "ZeroDeposit",
  6002: "InsufficientFunds",
  6003: "NotMatured",
  6004: "AlreadyMatured",
  6005: "MathOverflow",
  6006: "NoTimeElapsed",
  6007: "ZeroListingAmount",
  6008: "ZeroListingPrice",
  6009: "SelfPurchase",
  6010: "InsufficientTokens",
  6011: "VaultNotEmpty",
  6012: "VaultAlreadySetup",
  6013: "PoolNotEmpty",
  6014: "Unauthorized",
};

function lookupByNumber(num: number): string | undefined {
  const code = NUMBER_TO_CODE[num];
  return code ? CODE_MESSAGES[code] : undefined;
}

// Solana / web3.js attaches simulation logs as `err.logs: string[]`. When a program
// throws an Anchor error, the runtime emits a line like:
//   "Program log: AnchorError occurred. Error Code: AlreadyMatured. Error Number: 6004. Error Message: ..."
// or just "Program X failed: custom program error: 0x1774".
// Scan logs for either form before falling back to message-string heuristics.
function scanLogsForAnchorCode(logs: string[]): string | undefined {
  for (const line of logs) {
    const codeMatch = line.match(/Error Code:\s*([A-Za-z]+)/);
    if (codeMatch && CODE_MESSAGES[codeMatch[1]]) {
      return CODE_MESSAGES[codeMatch[1]];
    }
    const numMatch = line.match(/Error Number:\s*(\d+)/);
    if (numMatch) {
      const mapped = lookupByNumber(parseInt(numMatch[1], 10));
      if (mapped) return mapped;
    }
    const hexMatch = line.match(/custom program error:\s*0x([0-9a-fA-F]+)/);
    if (hexMatch) {
      const mapped = lookupByNumber(parseInt(hexMatch[1], 16));
      if (mapped) return mapped;
    }
  }
  return undefined;
}

/**
 * Parse Solana/Anchor transaction errors into user-friendly messages.
 * Prefers structured AnchorError matching, falls back to log scanning, then
 * substring matching on the message. Hides internal details (PDA seeds,
 * account addresses, compute units).
 */
export function parseTransactionError(err: unknown): string {
  if (err instanceof AnchorError) {
    const mapped = CODE_MESSAGES[err.error.errorCode.code];
    if (mapped) return mapped;
  }

  // SendTransactionError and SimulatedTransactionResponse expose .logs
  const maybeLogs = (err as { logs?: unknown })?.logs;
  if (Array.isArray(maybeLogs)) {
    const fromLogs = scanLogsForAnchorCode(maybeLogs as string[]);
    if (fromLogs) return fromLogs;
  }

  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : "Transaction failed";

  // Same scan against the message string in case logs were folded in (rpc-side errors)
  const fromMsgScan = scanLogsForAnchorCode([msg]);
  if (fromMsgScan) return fromMsgScan;

  // "Custom":NNNN appears in JSON-encoded transaction errors from confirmTransaction
  const customMatch = msg.match(/"Custom"\s*:\s*(\d+)/);
  if (customMatch) {
    const mapped = lookupByNumber(parseInt(customMatch[1], 10));
    if (mapped) return mapped;
  }

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
  if (msg.includes("already in use")) {
    return "You already have an active listing for this vault. Cancel it first.";
  }

  // Wallet errors
  if (msg.includes("User rejected")) return "Transaction cancelled.";
  if (msg.includes("Wallet not ready")) {
    return "Wallet is still loading. Please wait a moment and try again.";
  }

  return "Something went wrong. Please try again.";
}
