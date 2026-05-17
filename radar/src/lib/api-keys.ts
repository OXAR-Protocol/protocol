import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const KEY_PREFIX = "rdr_live_";
const SECRET_BYTES = 16; // 128 bits of entropy, matches Stripe-style keys

export type ApiKeyTier = "free" | "starter" | "pro" | "enterprise";

export interface ApiKeyMaterial {
  /** Raw key shown to the user exactly once. Format: `rdr_live_<base64url>`. */
  raw: string;
  /** SHA-256 of the raw key. Stored in `radar.api_keys.key_hash`. */
  hash: string;
  /** First 16 chars of raw key. Publicly displayable in the dashboard. */
  prefix: string;
}

export function mintApiKey(): ApiKeyMaterial {
  const secret = randomBytes(SECRET_BYTES).toString("base64url");
  const raw = `${KEY_PREFIX}${secret}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 16),
  };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("base64url");
}

export function parseBearer(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) return null;
  const match = authorizationHeader.match(/^Bearer\s+(\S+)$/i);
  if (!match) return null;
  const token = match[1]!;
  if (!token.startsWith(KEY_PREFIX)) return null;
  return token;
}

/** Constant-time comparison of two equal-length strings. */
export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return timingSafeEqual(ab, bb);
}

export const TIER_RATE_LIMITS: Readonly<Record<ApiKeyTier, number>> = {
  free: 60,
  starter: 600,
  pro: 6000,
  enterprise: 60000,
};

export const TIER_MONTHLY_QUOTAS: Readonly<Record<ApiKeyTier, number>> = {
  free: 10_000,
  starter: 100_000,
  pro: 1_000_000,
  enterprise: 100_000_000,
};
