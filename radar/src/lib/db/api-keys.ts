import "server-only";

import type { ApiKeyTier } from "../api-keys";
import { TIER_MONTHLY_QUOTAS, TIER_RATE_LIMITS } from "../api-keys";
import { getDb } from "./client";

export interface ApiKeyRecord {
  id: string;
  userId: string | null;
  name: string | null;
  keyPrefix: string;
  tier: ApiKeyTier;
  rateLimitPerMin: number;
  monthlyQuota: number;
  createdAt: string;
  lastUsedAt: string | null;
}

interface ApiKeyRow {
  id: string;
  user_id: string | null;
  name: string | null;
  key_prefix: string;
  tier: string;
  rate_limit_per_min: number;
  monthly_quota: number;
  created_at: Date;
  last_used_at: Date | null;
}

export interface CreateApiKeyInput {
  name: string | null;
  keyHash: string;
  keyPrefix: string;
  tier: ApiKeyTier;
  userId?: string | null;
}

export async function insertApiKey(input: CreateApiKeyInput): Promise<ApiKeyRecord> {
  const sql = getDb();
  const rows = await sql<ApiKeyRow[]>`
    insert into radar.api_keys
      (user_id, name, key_hash, key_prefix, tier, rate_limit_per_min, monthly_quota)
    values
      (${input.userId ?? null}, ${input.name},
       ${input.keyHash}, ${input.keyPrefix}, ${input.tier},
       ${TIER_RATE_LIMITS[input.tier]}, ${TIER_MONTHLY_QUOTAS[input.tier]})
    returning id, user_id, name, key_prefix, tier,
              rate_limit_per_min, monthly_quota, created_at, last_used_at
  `;
  return rowToRecord(rows[0]!);
}

export async function findApiKeyByHash(keyHash: string): Promise<ApiKeyRecord | null> {
  const sql = getDb();
  const rows = await sql<ApiKeyRow[]>`
    select id, user_id, name, key_prefix, tier,
           rate_limit_per_min, monthly_quota, created_at, last_used_at
    from radar.api_keys
    where key_hash = ${keyHash}
      and revoked_at is null
    limit 1
  `;
  return rows[0] ? rowToRecord(rows[0]) : null;
}

export async function touchApiKey(id: string): Promise<void> {
  const sql = getDb();
  await sql`update radar.api_keys set last_used_at = now() where id = ${id}`;
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const sql = getDb();
  const rows = await sql<ApiKeyRow[]>`
    select id, user_id, name, key_prefix, tier,
           rate_limit_per_min, monthly_quota, created_at, last_used_at
    from radar.api_keys
    where revoked_at is null
    order by created_at desc
  `;
  return rows.map(rowToRecord);
}

export async function listApiKeysForUser(userId: string): Promise<ApiKeyRecord[]> {
  const sql = getDb();
  const rows = await sql<ApiKeyRow[]>`
    select id, user_id, name, key_prefix, tier,
           rate_limit_per_min, monthly_quota, created_at, last_used_at
    from radar.api_keys
    where user_id = ${userId}
      and revoked_at is null
    order by created_at desc
  `;
  return rows.map(rowToRecord);
}

export async function revokeApiKeyForUser(
  id: string,
  userId: string,
): Promise<boolean> {
  const sql = getDb();
  const rows = await sql<{ id: string }[]>`
    update radar.api_keys
       set revoked_at = now()
     where id = ${id}
       and user_id = ${userId}
       and revoked_at is null
    returning id
  `;
  return rows.length > 0;
}

function rowToRecord(row: ApiKeyRow): ApiKeyRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    tier: row.tier as ApiKeyTier,
    rateLimitPerMin: row.rate_limit_per_min,
    monthlyQuota: row.monthly_quota,
    createdAt: row.created_at.toISOString(),
    lastUsedAt: row.last_used_at ? row.last_used_at.toISOString() : null,
  };
}
