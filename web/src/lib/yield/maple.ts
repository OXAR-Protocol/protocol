import { createSwapHoldProvider } from "./swap-hold";

/**
 * Maple syrupUSDC — institutional private credit. Maple lends pooled USDC to vetted
 * firms at fixed terms; syrupUSDC is a classic SPL whose value accrues in PRICE as
 * that interest compounds (no lockup — swap out anytime). Higher yield than open
 * lending, with credit risk on the borrowers (riskLevel: medium).
 *
 * Built from the shared swap-and-hold factory (same proven rail as Ondo USDY).
 * APY comes from DefiLlama's Maple USDC pool — the protocol-wide Syrup rate that
 * syrupUSDC accrues. Mint verified on-chain (classic SPL Token, 6 decimals) and
 * Jupiter liquidity verified both ways (near-zero price impact at retail size).
 */
export const mapleSyrupProvider = createSwapHoldProvider({
  id: "maple-solana",
  name: "Maple syrupUSDC",
  description: "Institutional private credit · yield accrues in price · swap out anytime",
  riskLevel: "medium",
  heldMint: "AvZZF1YaZDziPY2RCK4oJrRVrbN3mTD9NL24hPeaZeUj",
  heldDecimals: 6,
  defiLlamaPoolId: "43641cf5-a92e-416b-bce9-27113d3c0db6",
});
