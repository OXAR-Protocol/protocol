import "server-only";

import type { ApiKeyTier } from "../api-keys";
import { getDb } from "./client";

export interface SubscriptionRecord {
  id: string;
  userId: string;
  tier: ApiKeyTier;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  paymentChannel: string | null;
}

interface SubRow {
  id: string;
  user_id: string;
  tier: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: string;
  current_period_end: Date | null;
  payment_channel: string | null;
}

function rowToRecord(r: SubRow): SubscriptionRecord {
  return {
    id: r.id,
    userId: r.user_id,
    tier: r.tier as ApiKeyTier,
    stripeCustomerId: r.stripe_customer_id,
    stripeSubscriptionId: r.stripe_subscription_id,
    status: r.status,
    currentPeriodEnd: r.current_period_end ? r.current_period_end.toISOString() : null,
    paymentChannel: r.payment_channel,
  };
}

export async function getSubscriptionByUser(userId: string): Promise<SubscriptionRecord | null> {
  const sql = getDb();
  const rows = await sql<SubRow[]>`
    select * from radar.subscriptions where user_id = ${userId} limit 1
  `;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

export async function upsertStripeCustomer(
  userId: string,
  stripeCustomerId: string,
): Promise<void> {
  const sql = getDb();
  await sql`
    insert into radar.subscriptions (user_id, tier, stripe_customer_id, status, payment_channel)
    values (${userId}, 'free', ${stripeCustomerId}, 'inactive', 'stripe')
    on conflict (user_id) do update set
      stripe_customer_id = excluded.stripe_customer_id,
      payment_channel = 'stripe',
      updated_at = now()
  `;
}

export async function applyStripeSubscriptionEvent(args: {
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  tier: ApiKeyTier;
  status: string;
  currentPeriodEnd: Date;
}): Promise<void> {
  const sql = getDb();
  await sql`
    update radar.subscriptions
       set stripe_subscription_id = ${args.stripeSubscriptionId},
           tier = ${args.tier},
           status = ${args.status},
           current_period_end = ${args.currentPeriodEnd},
           payment_channel = 'stripe',
           updated_at = now()
     where stripe_customer_id = ${args.stripeCustomerId}
  `;
}
