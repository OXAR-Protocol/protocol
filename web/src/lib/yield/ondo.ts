import { createSwapHoldProvider } from "./swap-hold";

/**
 * Ondo USDY — tokenized US Treasuries, the first RWA on OXAR. A classic SPL whose
 * yield (~3.5% T-bill rate) accrues by the token's PRICE rising — holding it earns,
 * no staking or lockup. Built from the shared swap-and-hold factory (see
 * `swap-hold.ts`): deposit swaps USDC→USDY, withdraw swaps back, funds stay in the
 * user's own wallet. DefiLlama pool = Ondo USDY on Solana ("ondo-yield-assets").
 */
export const ondoUsdyProvider = createSwapHoldProvider({
  id: "ondo-usdy",
  name: "Ondo USDY",
  description: "Tokenized US Treasuries · yield accrues in price · swap out anytime",
  riskLevel: "low",
  heldMint: "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6",
  heldDecimals: 6,
  defiLlamaPoolId: "00b83068-9f87-4411-b5d7-5d2ff48c40c4",
});
