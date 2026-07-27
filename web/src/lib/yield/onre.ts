import { createSwapHoldProvider } from "./swap-hold";

/**
 * OnRe ONyc — tokenized reinsurance, the highest-yielding source in the catalog
 * (~11.7% vs ~5% for open lending). OnRe underwrites short-duration insurance and
 * reinsurance from a Bermuda segregated account (BMA-licensed, Class IIGB + Class F);
 * ONyc is a share of it, and the yield is earned premiums plus the return on the
 * T-bill/stablecoin collateral. Non-rebasing: value accrues in NAV, published daily
 * on-chain, so the same swap-and-hold rail as Ondo USDY and Maple syrupUSDC works
 * unchanged — buy swaps USDC → ONyc, sell swaps back, no lockup.
 *
 * Verified before listing: classic SPL Token (so no transfer fee / hook / permanent
 * delegate — the Kora gasless path needs no change), 9 decimals, and Jupiter depth
 * far beyond retail size (0.02% price impact at $10k in, ~0% back out) routed through
 * venues already in Kora's program allowlist.
 *
 * The risk is genuinely different from the rest of the catalog and the copy says so:
 * this is an underwriting-risk premium, so a bad catastrophe season can cut NAV. The
 * mint also has a live freeze authority (as syrupUSDC does), and OnRe's own primary
 * redemption is KYC-gated — for our users the exit is the DEX, which is why the
 * liquidity check above is a listing condition, not a nice-to-have.
 *
 * Piloted behind the beta allowlist first (deposit + withdraw with real money),
 * then opened to everyone.
 */
export const onreOnycProvider = createSwapHoldProvider({
  id: "onre-onyc",
  name: "OnRe ONyc",
  description: "Tokenized reinsurance · yield accrues in price · swap out anytime",
  riskLevel: "medium",
  heldMint: "5Y8NV33Vv7WbnLfq3zBcKSdYPrk7g2KoiQoe7M2tcxp5",
  heldDecimals: 9,
  defiLlamaPoolId: "7083d6a5-e3cb-4eeb-8204-f1b735e4ecbb",
});
