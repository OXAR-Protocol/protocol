import { NextResponse } from "next/server";

import { getSubscriptionByUser } from "@/lib/db/subscriptions";
import { getServerEnv } from "@/lib/env";
import { PrivyAuthError, verifyPrivyToken } from "@/lib/privy-server";
import { StripeNotConfiguredError, getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const sub = await getSubscriptionByUser(userId);
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "no_customer" }, { status: 404 });
  }

  try {
    const env = getServerEnv();
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${env.appBaseUrl}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      return NextResponse.json({ error: "stripe_not_configured" }, { status: 503 });
    }
    console.error("Stripe portal failed", err);
    return NextResponse.json({ error: "portal_failed" }, { status: 500 });
  }
}
