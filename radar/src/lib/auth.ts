import "server-only";

import { NextResponse } from "next/server";

import { findApiKeyByHash, touchApiKey, type ApiKeyRecord } from "./db/api-keys";
import { logUsage } from "./db/api-usage";
import { hashApiKey, parseBearer } from "./api-keys";
import { checkApiKeyRateLimit } from "./rate-limit-redis";

export interface AuthorizedContext {
  apiKey: ApiKeyRecord;
}

type AuthorizedHandler<Params> = (
  request: Request,
  ctx: { params: Promise<Params>; auth: AuthorizedContext },
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a route handler with API-key authentication, per-key rate
 * limiting, and usage logging.
 *
 * Behavior:
 * - Missing or malformed Authorization → 401, no usage logged.
 * - Unknown / revoked key → 401, no usage logged.
 * - Over the tier's per-minute limit → 429 with Retry-After.
 * - Otherwise: handler runs, usage row inserted, last_used_at touched.
 */
export function withApiKey<Params = Record<string, string>>(
  handler: AuthorizedHandler<Params>,
): (request: Request, ctx: { params: Promise<Params> }) => Promise<NextResponse> {
  return async (request, ctx) => {
    const raw = parseBearer(request.headers.get("authorization"));
    if (!raw) return unauthorized("missing_api_key");

    const apiKey = await findApiKeyByHash(hashApiKey(raw));
    if (!apiKey) return unauthorized("invalid_api_key");

    const rl = await checkApiKeyRateLimit(apiKey.id, apiKey.rateLimitPerMin);
    if (!rl.allowed) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { error: "rate_limited", resetAt: rl.resetAt },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders(apiKey, rl.remaining, rl.resetAt),
            "Retry-After": String(retryAfter),
          },
        },
      );
    }

    const start = Date.now();
    let response: NextResponse;
    try {
      response = await handler(request, { params: ctx.params, auth: { apiKey } });
    } catch (err) {
      console.error("Authorized handler threw", err);
      response = NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    for (const [k, v] of Object.entries(rateLimitHeaders(apiKey, rl.remaining, rl.resetAt))) {
      response.headers.set(k, v);
    }
    response.headers.set("X-Api-Key-Tier", apiKey.tier);

    const endpoint = new URL(request.url).pathname;
    void logUsage({
      apiKeyId: apiKey.id,
      endpoint,
      method: request.method,
      statusCode: response.status,
      latencyMs: Date.now() - start,
    });
    void touchApiKey(apiKey.id);

    return response;
  };
}

function unauthorized(code: string): NextResponse {
  return NextResponse.json({ error: code }, { status: 401 });
}

function rateLimitHeaders(
  apiKey: ApiKeyRecord,
  remaining: number,
  resetAt: number,
): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(apiKey.rateLimitPerMin),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}
