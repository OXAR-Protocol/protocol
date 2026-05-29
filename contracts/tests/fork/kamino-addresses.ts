// Kamino Lend (klend) mainnet account addresses for the main-market USDC reserve.
// Resolved once from mainnet via @kamino-finance/klend-sdk (Reserve.decode) — see
// the resolver in .kamino-ref/. These are stable for the lifetime of the reserve.
//
// Used by mainnet-fork tests: every address here must be cloned in Anchor.toml
// [[test.validator.clone]] so the local fork can CPI into real Kamino state.
import { PublicKey } from "@solana/web3.js";

export const KAMINO = {
  klendProgram: new PublicKey("KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD"),
  reserve: new PublicKey("D6q6wuQSrifJKZYpR1M8R4YawnLDtDsMmWM1NbBmgJ59"),
  lendingMarket: new PublicKey("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF"),
  lendingMarketAuthority: new PublicKey("9DrvZvyWh1HuAoZxvYWMvkf2XCzryCpGgHqrMjyDWpmo"),
  liquidityMint: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"), // USDC
  liquiditySupplyVault: new PublicKey("Bgq7trRgVMeq33yt235zM2onQ4bRDBsY5EWiTetF4qw6"),
  collateralMint: new PublicKey("B8V6WVjPxW1UGwVDfxH2d2r8SyT4cqn7dQRK6XneVa7D"),
  collateralSupplyVault: new PublicKey("3DzjXRfxRm6iejfyyMynR4tScddaanrePJ1NJU2XnPPL"),
  // USDC reserve prices via Scope; pyth/switchboard are unset (pass klendProgram as
  // the None-placeholder in refresh_reserve).
  scopePrices: new PublicKey("3t4JZcueEzTbVP6kLxXrL3VpWx45jDer4eqysweBchNH"),
} as const;
