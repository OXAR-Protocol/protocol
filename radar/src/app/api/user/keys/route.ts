import { NextResponse } from "next/server";

import { mintApiKey, type ApiKeyTier } from "@/lib/api-keys";
import { insertApiKey, listApiKeysForUser } from "@/lib/db/api-keys";
import { PrivyAuthError, verifyPrivyToken } from "@/lib/privy-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authUser(request: Request): Promise<string | NextResponse> {
  try {
    return await verifyPrivyToken(request.headers.get("authorization"));
  } catch (err) {
    if (err instanceof PrivyAuthError) {
      const status = err.code === "server_not_configured" ? 503 : 401;
      return NextResponse.json({ error: err.code }, { status });
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const userOrResp = await authUser(request);
  if (userOrResp instanceof NextResponse) return userOrResp;

  const records = await listApiKeysForUser(userOrResp);
  return NextResponse.json({ data: records });
}

interface CreateBody {
  name?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const userOrResp = await authUser(request);
  if (userOrResp instanceof NextResponse) return userOrResp;
  const userId = userOrResp;

  let body: CreateBody;
  try {
    body = (await request.json().catch(() => ({}))) as CreateBody;
  } catch {
    body = {};
  }

  const name =
    typeof body.name === "string" && body.name.trim().length > 0
      ? body.name.trim().slice(0, 60)
      : null;

  // Self-serve sign-up only ever gets you free tier. Higher tiers are
  // issued by hand via /api/admin/keys while paid plans are paused.
  const tier: ApiKeyTier = "free";

  const material = mintApiKey();
  const record = await insertApiKey({
    name,
    keyHash: material.hash,
    keyPrefix: material.prefix,
    tier,
    userId,
  });

  return NextResponse.json(
    {
      apiKey: material.raw,
      record: {
        id: record.id,
        name: record.name,
        keyPrefix: record.keyPrefix,
        tier: record.tier,
        rateLimitPerMin: record.rateLimitPerMin,
        monthlyQuota: record.monthlyQuota,
        createdAt: record.createdAt,
      },
      warning: "Store apiKey now — it will not be shown again.",
    },
    { status: 201 },
  );
}
