import { NextResponse } from "next/server";

import { revokeApiKeyForUser } from "@/lib/db/api-keys";
import { PrivyAuthError, verifyPrivyToken } from "@/lib/privy-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteParams): Promise<NextResponse> {
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

  const { id } = await params;
  const ok = await revokeApiKeyForUser(id, userId);

  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ revoked: true });
}
