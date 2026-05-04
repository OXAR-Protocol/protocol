/**
 * Discriminated union describing what's selected in the From-column of the
 * Explore screen. `fiat` is the buy flow (deposit USDC into a vault),
 * `bond` is the send flow (transfer existing vault tokens to a wallet).
 */
export type SwapSource =
  | { kind: "fiat"; methodId: string }
  | { kind: "bond"; vaultId: string };

export const DEFAULT_SOURCE: SwapSource = { kind: "fiat", methodId: "USDC" };
