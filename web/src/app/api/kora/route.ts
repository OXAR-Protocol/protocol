import { NextRequest, NextResponse } from "next/server";

/**
 * Server proxy for the Kora gasless relayer. The browser calls THIS route (same-origin);
 * we attach the `x-api-key` and forward to the Kora node. The key never reaches the client
 * — with the alpha sponsored-gas model an open node would be drainable, so this gate is
 * load-bearing. Only the handful of methods the client needs are allowed through.
 */
const KORA_RPC_URL = process.env.KORA_RPC_URL;
const KORA_API_KEY = process.env.KORA_API_KEY;

const ALLOWED_METHODS = new Set([
  "getPayerSigner",
  "getBlockhash",
  "signAndSendTransaction",
  "getConfig",
]);

export async function POST(req: NextRequest) {
  if (!KORA_RPC_URL || !KORA_API_KEY) {
    return NextResponse.json({ error: { message: "Kora not configured" } }, { status: 503 });
  }

  let body: { method?: unknown; params?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { message: "Invalid JSON" } }, { status: 400 });
  }

  const method = body?.method;
  if (typeof method !== "string" || !ALLOWED_METHODS.has(method)) {
    return NextResponse.json({ error: { message: "Method not allowed" } }, { status: 403 });
  }

  try {
    const upstream = await fetch(KORA_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KORA_API_KEY },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: body.params }),
    });
    const json = await upstream.json();
    return NextResponse.json(json, { status: upstream.status });
  } catch {
    return NextResponse.json({ error: { message: "Kora upstream unreachable" } }, { status: 502 });
  }
}
