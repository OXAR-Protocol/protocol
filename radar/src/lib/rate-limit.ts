// In-memory sliding-window rate limiter. Single-instance only.
// Phase 2 swaps this for Upstash Redis so limits work across regions.

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { hits: [] };

  const fresh = bucket.hits.filter((t) => t > cutoff);
  const resetAt = fresh.length > 0 ? fresh[0] + windowMs : now + windowMs;

  if (fresh.length >= maxRequests) {
    buckets.set(key, { hits: fresh });
    return { allowed: false, remaining: 0, resetAt };
  }

  fresh.push(now);
  buckets.set(key, { hits: fresh });

  return {
    allowed: true,
    remaining: maxRequests - fresh.length,
    resetAt,
  };
}

export function clientIpFrom(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
