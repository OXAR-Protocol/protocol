import {
  jupiterUsdcProvider,
  jupiterUsdtProvider,
  // jupiterUsdgProvider — delisted 2026-07-17. USDG (`2u1t…`) is a Token-2022 mint with
  // a transfer-FEE + a permanentDelegate (a third party can move a user's USDG) + a
  // transfer hook. That (a) breaks Kora gasless — its validator rejects the
  // `transferCheckedWithFee` CPI, so 0-SOL deposits fail — and (b) contradicts the
  // product promise ("your money, can't be frozen"). It also had the worst APY of the
  // three. Factory kept in ./jupiter for a future re-add if USDG ever ships clean.
} from "./jupiter";
// kaminoUsdcProvider — delisted 2026-07-18. It's strictly worse than Jupiter Lend for
// USDC (lower APY ~3.5% vs ~4.5%, ~12x the gasless onboarding cost because klend uses a
// fat 3344-byte Obligation account, heavier WASM integration) AND it was broken: the
// server resolved getReservesByMint(USDC)[0], which returns a DEAD reserve (deposit
// limit 0) instead of the main one, so every deposit failed with DepositLimitExceeded.
// Provider code kept (./kamino, ./kamino-server, /api/kamino) for a possible future
// re-add with the correct reserve; just not registered.
import { ondoUsdyProvider } from "./ondo";
import { mapleSyrupProvider } from "./maple";
import { xstockProviders } from "./xstocks";
import { goldProviders } from "./gold";
import type { YieldProvider } from "./types";

/**
 * Whitelisted yield providers for v1. Adding a source = append one provider;
 * the marketplace and hooks pick it up automatically.
 */
export const PROVIDERS: readonly YieldProvider[] = [
  jupiterUsdcProvider,
  jupiterUsdtProvider,
  ondoUsdyProvider,
  mapleSyrupProvider,
  ...xstockProviders,
  ...goldProviders,
];

export function getProvider(id: string): YieldProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
