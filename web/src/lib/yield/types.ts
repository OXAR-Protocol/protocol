import type { Connection, PublicKey, TransactionInstruction } from "@solana/web3.js";

/**
 * A user's current position in one yield provider, denominated in the
 * underlying asset's base units (e.g. USDC with 6 decimals).
 */
export interface YieldPosition {
  /** Principal + accrued yield, in the underlying asset's base units. */
  underlyingBalance: bigint;
  /** Provider-internal share/cToken balance (for withdraw-by-shares flows). */
  shares: bigint;
}

export interface BuildIxParams {
  /** Wallet that owns the position and signs the transaction. */
  owner: PublicKey;
  /** Amount in the underlying asset's base units. */
  amount: bigint;
  connection: Connection;
}

/**
 * Uniform interface every yield source implements. The UI and hooks talk only
 * to this — adding a protocol means adding one implementation, no UI changes.
 *
 * Implementations return raw instructions; the calling hook assembles and sends
 * the transaction (so deposits/withdraws compose with ATA creation, priority
 * fees, etc.).
 */
export interface YieldProvider {
  /** Stable id, e.g. "jupiter-lend-usdc". */
  readonly id: string;
  /** Human label, e.g. "Jupiter Lend". */
  readonly name: string;
  /** Underlying asset mint (e.g. USDC). */
  readonly asset: PublicKey;
  /** Asset ticker for display, e.g. "USDC". */
  readonly assetSymbol: string;
  /** Underlying asset decimals (USDC = 6). */
  readonly decimals: number;

  /** One-line marketplace description. */
  readonly description: string;
  /** Risk tier for display tone. */
  readonly riskLevel: "low" | "medium" | "high";
  /** Chain the source lives on (v1: Solana only). */
  readonly chain: "solana" | "ethereum";

  /** Instructions to deposit `amount` of the underlying asset. */
  buildDepositIxs(p: BuildIxParams): Promise<TransactionInstruction[]>;
  /** Instructions to withdraw `amount` of the underlying asset. */
  buildWithdrawIxs(p: BuildIxParams): Promise<TransactionInstruction[]>;
  /** Current position for `owner` (zeroed if none). */
  getPosition(owner: PublicKey, connection: Connection): Promise<YieldPosition>;
  /** Current supply APY as a fraction (0.06 = 6%). */
  getApy(connection: Connection): Promise<number>;
}
