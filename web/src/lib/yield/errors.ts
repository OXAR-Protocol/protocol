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
 * Best-effort readable text from any thrown value. Plain objects (Privy / wallet /
 * WalletConnect errors) `String()` to a useless "[object Object]", so dig out a
 * message field, else JSON-stringify, else list keys.
 */
function rawText(e: unknown): string {
  if (e instanceof Error) {
    // Solana SendTransactionError carries the on-chain reason in `.logs`, not the
    // message — surface the tail so program errors are diagnosable.
    const logs = (e as { logs?: unknown }).logs;
    const tail = Array.isArray(logs) && logs.length ? ` | logs: ${logs.slice(-4).join(" / ")}` : "";
    return e.message + tail;
  }
  if (typeof e === "string") return e;
  if (e && typeof e === "object") {
    const o = e as Record<string, unknown>;
    const nested = (o.error ?? o.data) as Record<string, unknown> | undefined;
    const msg = o.message ?? nested?.message ?? o.reason ?? o.error;
    if (typeof msg === "string" && msg.trim()) {
      const code = o.code ?? nested?.code;
      return code != null ? `${msg} [${String(code)}]` : msg;
    }
    try {
      const json = JSON.stringify(e);
      if (json && json !== "{}") return json;
    } catch {
      /* circular — fall through */
    }
    try {
      return `object keys: ${Object.keys(o).join(", ")}`;
    } catch {
      /* exotic — fall through */
    }
  }
  return String(e);
}

/**
 * Map raw chain / wallet / SDK errors to a short, friendly, non-scary message.
 * The raw error is still logged to the console for debugging.
 */
export function toFriendlyError(e: unknown): string {
  // Our own deliberate messages pass straight through — don't clobber them.
  if (e instanceof UserFacingError) return e.message;

  const rawMsg = rawText(e);
  const raw = rawMsg.toLowerCase();
  const detail = rawMsg.trim().replace(/\s+/g, " ").slice(0, 300);

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
    // SPL InsufficientFunds is exactly 0x1 — don't match 0x1771 (slippage) etc.
    /0x1(?![0-9a-f])/.test(raw)
  ) {
    return "Not enough balance — check you have enough of the token you're paying with, plus a little SOL for the network fee.";
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
  // Include the raw detail/logs: the on-chain reason (program error, slippage) is
  // the actionable part and is otherwise invisible in the field.
  if (
    raw.includes("simulation failed") ||
    raw.includes("transaction") ||
    raw.includes("instruction")
  ) {
    return `Couldn't complete that transaction. Please try again.${detail ? ` (${detail})` : ""}`;
  }

  // Unrecognized error — surface a trimmed raw detail so it's diagnosable in the
  // field (esp. external-wallet signing failures that don't match any pattern
  // above) instead of being swallowed by a bare generic message.
  return `Something went wrong. Please try again.${detail ? ` (${detail})` : ""}`;
}
