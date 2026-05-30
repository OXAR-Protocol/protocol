import {
  jupiterUsdcProvider,
  jupiterUsdtProvider,
  jupiterUsdgProvider,
} from "./jupiter";
import type { YieldProvider } from "./types";

/**
 * Whitelisted yield providers for v1. Adding a source = append one provider;
 * the marketplace and hooks pick it up automatically.
 */
export const PROVIDERS: readonly YieldProvider[] = [
  jupiterUsdcProvider,
  jupiterUsdtProvider,
  jupiterUsdgProvider,
];

export function getProvider(id: string): YieldProvider | undefined {
  return PROVIDERS.find((p) => p.id === id);
}
