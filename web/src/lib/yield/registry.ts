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
import { kaminoUsdcProvider } from "./kamino";
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
  kaminoUsdcProvider,
  ondoUsdyProvider,
  mapleSyrupProvider,
  ...xstockProviders,
  ...goldProviders,
];

export function getProvider(id: string): YieldProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
