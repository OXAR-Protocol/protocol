import "server-only";

import Stripe from "stripe";

import type { ApiKeyTier } from "./api-keys";
import { getServerEnv } from "./env";

let cached: Stripe | undefined;

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured");
  }
}

export function getStripe(): Stripe {
  if (cached) return cached;
  const env = getServerEnv();
  if (!env.stripeSecretKey) throw new StripeNotConfiguredError();
  cached = new Stripe(env.stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
  });
  return cached;
}

export type StripePaidTier = Exclude<ApiKeyTier, "free" | "enterprise">;

export function priceIdFor(tier: StripePaidTier): string {
  const env = getServerEnv();
  const id = tier === "starter" ? env.stripePriceStarter : env.stripePricePro;
  if (!id) throw new StripeNotConfiguredError();
  return id;
}

export const SUPPORTED_PAID_TIERS: readonly StripePaidTier[] = ["starter", "pro"];
