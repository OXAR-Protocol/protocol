import { NextResponse } from "next/server";

import type Stripe from "stripe";

import type { ApiKeyTier } from "@/lib/api-keys";
import { applyStripeSubscriptionEvent } from "@/lib/db/subscriptions";
import { getServerEnv } from "@/lib/env";
import { StripeNotConfiguredError, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const env = getServerEnv();
  if (!env.stripeWebhookSecret) {
    return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const payload = await request.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(payload, sig, env.stripeWebhookSecret);
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }
    console.error("Stripe signature verification failed", err);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      await handleSubscriptionEvent(event.data.object as Stripe.Subscription);
      break;
    default:
      // Ignore other event types for v0.1.
      break;
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionEvent(sub: Stripe.Subscription): Promise<void> {
  const tier = readTierFromMetadata(sub.metadata) ?? "starter";
  const status = sub.status === "canceled" ? "cancelled" : sub.status;

  await applyStripeSubscriptionEvent({
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    tier,
    status,
    currentPeriodEnd: new Date(sub.current_period_end * 1000),
  });
}

function readTierFromMetadata(metadata: Stripe.Metadata): ApiKeyTier | null {
  const raw = metadata.tier;
  if (raw === "starter" || raw === "pro") return raw;
  return null;
}
