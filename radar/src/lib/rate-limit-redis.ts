import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { checkRateLimit, type RateLimitResult } from "./rate-limit";

let redisClient: Redis | undefined | null = undefined;
const limiterCache = new Map<number, Ratelimit>();

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

function limiterFor(perMin: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;
  const cached = limiterCache.get(perMin);
  if (cached) return cached;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(perMin, "1 m"),
    analytics: false,
    prefix: "radar:rl",
  });
  limiterCache.set(perMin, limiter);
  return limiter;
}

/**
 * Check the per-API-key rate limit.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL/TOKEN are set (production).
 * Falls back to the in-memory sliding-window limiter when they aren't,
 * which is correct only for single-instance dev — Vercel functions
 * are stateless so production REQUIRES Upstash.
 */
export async function checkApiKeyRateLimit(
  apiKeyId: string,
  perMinute: number,
): Promise<RateLimitResult> {
  const limiter = limiterFor(perMinute);

  if (limiter) {
    const { success, remaining, reset } = await limiter.limit(`key:${apiKeyId}`);
    return { allowed: success, remaining, resetAt: reset };
  }

  return checkRateLimit(`apikey:${apiKeyId}`, perMinute, 60_000);
}
