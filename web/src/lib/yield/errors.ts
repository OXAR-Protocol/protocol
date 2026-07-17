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

  // The raw text is used ONLY for pattern-matching below — never shown to the user
  // (callers already console.error the original, so it stays diagnosable).
  const raw = rawText(e).toLowerCase();

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
    return "Not enough balance — check you have enough USDC, plus a little SOL for the network fee.";
  }

  // Wallet not available.
  if (raw.includes("wallet not connected") || raw.includes("no wallet")) {
    return "Connect your wallet to continue.";
  }

  // Price moved past the slippage limit while the tx was in flight (swap/deposit).
  // 0x1771 (6001) is the common Jupiter slippage code — match it exactly, not 0x1771a…
  if (
    raw.includes("slippage") ||
    raw.includes("slippagetoleranceexceeded") ||
    /0x1771(?![0-9a-f])/.test(raw)
  ) {
    return "The price moved while we were sending it. Please try again.";
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

  // Wrong EVM network selected in the wallet. Trust Wallet phrases its own rejection
  // as "the indicated chainId is not the same as your selected chainId" — it validates
  // the send against the network the user picked IN the wallet, which a dApp-side
  // switchChain doesn't reliably change. Tell the user to switch it manually.
  if (
    raw.includes("unsupported chain") ||
    raw.includes("wrong network") ||
    raw.includes("switch chain") ||
    raw.includes("chainid is not the same") ||
    raw.includes("selected chainid") ||
    raw.includes("indicated chainid")
  ) {
    return "Open your wallet and switch its network to the chain you're paying from (e.g. Ethereum), then try again.";
  }

  // Generic on-chain failure (simulation / custom program error). We DON'T show the
  // raw logs — they're scary and unhelpful to users. The most common cause of a
  // deposit/buy failing here is not enough balance, so nudge toward that.
  if (
    raw.includes("simulation failed") ||
    raw.includes("custom program error") ||
    raw.includes("transaction") ||
    raw.includes("instruction")
  ) {
    return "This didn't go through — most often that's not enough balance for the amount plus the network fee. Please check and try again.";
  }

  // Unrecognized error — a calm generic message. The raw error is in the console
  // (callers log it) for diagnosis; the user just sees something reassuring.
  return "Something went wrong. Please try again.";
}
