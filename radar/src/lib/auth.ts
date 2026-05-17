import "server-only";

import { NextResponse } from "next/server";

import { findApiKeyByHash, touchApiKey, type ApiKeyRecord } from "./db/api-keys";
import { logUsage } from "./db/api-usage";
import { hashApiKey, parseBearer } from "./api-keys";

export interface AuthorizedContext {
  apiKey: ApiKeyRecord;
}

type AuthorizedHandler<Params> = (
  request: Request,
  ctx: { params: Promise<Params>; auth: AuthorizedContext },
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps a route handler with API-key authentication and usage logging.
 *
 * Behavior:
 * - Missing or malformed Authorization → 401, no usage logged.
 * - Unknown / revoked key → 401, no usage logged.
 * - Valid key → handler runs, usage row inserted, last_used_at touched.
 */
export function withApiKey<Params = Record<string, string>>(
  handler: AuthorizedHandler<Params>,
): (request: Request, ctx: { params: Promise<Params> }) => Promise<NextResponse> {
  return async (request, ctx) => {
    const raw = parseBearer(request.headers.get("authorization"));
    if (!raw) return unauthorized("missing_api_key");

    const apiKey = await findApiKeyByHash(hashApiKey(raw));
    if (!apiKey) return unauthorized("invalid_api_key");

    const start = Date.now();
    let response: NextResponse;

    try {
      response = await handler(request, { params: ctx.params, auth: { apiKey } });
    } catch (err) {
      console.error("Authorized handler threw", err);
      response = NextResponse.json({ error: "internal_error" }, { status: 500 });
    }

    response.headers.set("X-RateLimit-Limit", String(apiKey.rateLimitPerMin));
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
