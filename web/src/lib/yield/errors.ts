/**
 * An error whose message is ALREADY user-facing (a deliberate, friendly message
 * we threw on purpose — e.g. "Fees are too high"). `toFriendlyError` surfaces it
 * verbatim instead of re-mapping it to a generic fallback.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/**
 * Map raw chain / wallet / SDK errors to a short, friendly, non-scary message.
 * The raw error is still logged to the console for debugging.
 */
export function toFriendlyError(e: unknown): string {
  // Our own deliberate messages pass straight through — don't clobber them.
  if (e instanceof UserFacingError) return e.message;

  const raw = (e instanceof Error ? e.message : String(e)).toLowerCase();

  // User dismissed the wallet popup — not really an error.
  if (
    raw.includes("user rejected") ||
    raw.includes("rejected the request") ||
    raw.includes("user denied") ||
    raw.includes("declined") ||
    raw.includes("cancelled") ||
    raw.includes("canceled")
  ) {
    return "Cancelled — nothing left your wallet.";
  }

  // Blockhash expired / transaction took too long before reaching the network.
  if (
    raw.includes("blockhash") ||
    raw.includes("block height exceeded") ||
    raw.includes("expired")
  ) {
    return "That took too long and expired before it was sent. Please try again.";
  }

  // Not enough balance to cover the amount or the network fee.
  if (
    raw.includes("insufficient") ||
    raw.includes("not enough") ||
    raw.includes("debit an account") ||
    raw.includes("0x1")
  ) {
    return "Not enough balance — check you have enough USDC, plus a little SOL for the network fee.";
  }

  // Wallet not available.
  if (raw.includes("wallet not connected") || raw.includes("no wallet")) {
    return "Connect your wallet to continue.";
  }

  // Network / RPC trouble.
  if (
    raw.includes("failed to fetch") ||
    raw.includes("network") ||
    raw.includes("timeout") ||
    raw.includes("timed out") ||
    raw.includes("429") ||
    raw.includes("503")
  ) {
    return "Network's being slow right now. Please try again in a moment.";
  }

  // EVM on-chain revert / failed gas estimation — the tx would fail as built.
  if (
    raw.includes("reverted") ||
    raw.includes("transfer_from_failed") ||
    raw.includes("cannot estimate gas")
  ) {
    return "That transaction would fail on-chain. Try a larger amount or a different asset.";
  }

  // Wrong EVM network selected in the wallet.
  if (
    raw.includes("unsupported chain") ||
    raw.includes("wrong network") ||
    raw.includes("switch chain")
  ) {
    return "Switch your wallet to the right network and try again.";
  }

  // Generic on-chain failure (simulation, etc.) — after the specific cases above.
  if (
    raw.includes("simulation failed") ||
    raw.includes("transaction") ||
    raw.includes("instruction")
  ) {
    return "Couldn't complete that transaction. Please try again.";
  }

  return "Something went wrong. Please try again.";
}
