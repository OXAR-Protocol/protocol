import { NextResponse } from "next/server";

import {
  getSubscriptionByUser,
  upsertStripeCustomer,
} from "@/lib/db/subscriptions";
import { getServerEnv } from "@/lib/env";
import { PrivyAuthError, verifyPrivyToken } from "@/lib/privy-server";
import {
  SUPPORTED_PAID_TIERS,
  StripeNotConfiguredError,
  getStripe,
  priceIdFor,
  type StripePaidTier,
} from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CheckoutBody {
  tier?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  let userId: string;
  try {
    userId = await verifyPrivyToken(request.headers.get("authorization"));
  } catch (err) {
    if (err instanceof PrivyAuthError) {
      const status = err.code === "server_not_configured" ? 503 : 401;
      return NextResponse.json({ error: err.code }, { status });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }

  let body: CheckoutBody;
  try {
    body = (await request.json()) as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (
    typeof body.tier !== "string" ||
    !SUPPORTED_PAID_TIERS.includes(body.tier as StripePaidTier)
  ) {
    return NextResponse.json({ error: "invalid_tier" }, { status: 400 });
  }
  const tier = body.tier as StripePaidTier;

  try {
    const env = getServerEnv();
    const stripe = getStripe();

    const existing = await getSubscriptionByUser(userId);
    let customerId = existing?.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({ metadata: { userId } });
      customerId = customer.id;
      await upsertStripeCustomer(userId, customer.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceIdFor(tier), quantity: 1 }],
      success_url: `${env.appBaseUrl}/dashboard?checkout=success`,
      cancel_url: `${env.appBaseUrl}/pricing?checkout=cancelled`,
      metadata: { userId, tier },
      subscription_data: { metadata: { userId, tier } },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }
    console.error("Stripe checkout failed", err);
    return NextResponse.json({ error: "checkout_failed" }, { status: 500 });
  }
}
