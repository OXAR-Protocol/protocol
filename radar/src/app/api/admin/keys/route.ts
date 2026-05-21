import { NextResponse } from "next/server";

import { mintApiKey, type ApiKeyTier } from "@/lib/api-keys";
import { insertApiKey, listApiKeys } from "@/lib/db/api-keys";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TIERS: readonly ApiKeyTier[] = ["free", "starter", "pro", "enterprise"];

/**
 * Internal admin endpoints for issuing customer API keys.
 *
 * Auth: `Authorization: Bearer <ADMIN_SECRET>` matches the env var.
 * Used by the operator (you) to mint keys before the customer
 * dashboard exists. When the dashboard ships in Phase 3, this stays
 * available for enterprise / out-of-band key issuance.
 */

function checkAdmin(request: Request): NextResponse | null {
  const env = getServerEnv();
  if (!env.adminSecret) {
    return NextResponse.json({ error: "admin_disabled" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${env.adminSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return null;
}

interface CreateKeyBody {
  name?: unknown;
  tier?: unknown;
  userId?: unknown;
}

export async function POST(request: Request): Promise<NextResponse> {
  const reject = checkAdmin(request);
  if (reject) return reject;

  let body: CreateKeyBody;
  try {
    body = (await request.json()) as CreateKeyBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const tier =
    typeof body.tier === "string" && VALID_TIERS.includes(body.tier as ApiKeyTier)
      ? (body.tier as ApiKeyTier)
      : "free";

  const name = typeof body.name === "string" && body.name.length > 0 ? body.name : null;
  const userId = typeof body.userId === "string" ? body.userId : null;

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

export async function GET(request: Request): Promise<NextResponse> {
  const reject = checkAdmin(request);
  if (reject) return reject;

  const records = await listApiKeys();
  return NextResponse.json({ data: records });
}
