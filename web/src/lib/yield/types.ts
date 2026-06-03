import type {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  VersionedTransaction,
} from "@solana/web3.js";

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

export interface RedeemIxParams {
  /** Wallet that owns the position and signs the transaction. */
  owner: PublicKey;
  /** Provider-internal shares to redeem (use the full balance for a clean exit). */
  shares: bigint;
  connection: Connection;
}

/**
 * Uniform interface every yield source implements. The UI and hooks talk only
 * to this — adding a protocol means adding one implementation, no UI changes.
 *
 * A provider implements EITHER the instruction-based methods (`build*Ixs` — the
 * hook assembles a legacy Transaction and signs+sends) OR the transaction-based
 * methods (`build*Tx` — the provider returns a fully-built VersionedTransaction,
 * e.g. Kamino, which is built server-side with kit/v0). The hook prefers `*Tx`.
 */
export interface RedeemTxParams {
  owner: PublicKey;
  connection: Connection;
}

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
  /**
   * Optional grouping id. Providers sharing a `group` (e.g. all Jupiter Lend
   * stablecoins) collapse into ONE marketplace card with an asset picker.
   */
  readonly group?: string;
  /** DefiLlama pool id — for accurate APY + historical chart series. */
  readonly defiLlamaPoolId?: string;

  // --- Instruction-based path (Jupiter Lend) ---
  /** Instructions to deposit `amount` of the underlying asset. */
  buildDepositIxs?(p: BuildIxParams): Promise<TransactionInstruction[]>;
  /** Instructions to withdraw `amount` of the underlying asset. */
  buildWithdrawIxs?(p: BuildIxParams): Promise<TransactionInstruction[]>;
  /**
   * Instructions to redeem `shares` directly. Used for full exits: redeeming the
   * entire share balance burns exactly what the user owns, so no rounding dust is
   * left stranded (asset-denominated withdraw rounds shares up and can't reach 100%).
   */
  buildRedeemIxs?(p: RedeemIxParams): Promise<TransactionInstruction[]>;

  // --- Transaction-based path (Kamino: server-built v0 VersionedTransaction;
  //     Ondo: a legacy Jupiter swap tx) ---
  /** A fully-built deposit transaction the wallet signs+sends as-is. */
  buildDepositTx?(p: BuildIxParams): Promise<VersionedTransaction | Transaction>;
  /** A fully-built partial-withdraw transaction. */
  buildWithdrawTx?(p: BuildIxParams): Promise<VersionedTransaction | Transaction>;
  /** A fully-built full-exit transaction (no share count needed). */
  buildRedeemTx?(p: RedeemTxParams): Promise<VersionedTransaction | Transaction>;

  /** Current position for `owner` (zeroed if none). */
  getPosition(owner: PublicKey, connection: Connection): Promise<YieldPosition>;
  /** Current supply APY as a fraction (0.06 = 6%). */
  getApy(connection: Connection): Promise<number>;
}
