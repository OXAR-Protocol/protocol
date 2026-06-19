import { NextResponse } from "next/server";

// Server-side Transak off-ramp: generate a single-use Secure Widget URL for a SELL
// flow. Transak now MANDATES this backend flow (the client apiKey-in-URL approach is
// deprecated). The API secret never leaves the server. Keys come from env:
//   TRANSAK_API_KEY      — partner API key
//   TRANSAK_API_SECRET   — partner API secret (generate in the Transak dashboard)
//   TRANSAK_ENV          — "STAGING" (default) | "PRODUCTION"
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ENV = (process.env.TRANSAK_ENV ?? "STAGING").toUpperCase();
const REFRESH_BASE = ENV === "PRODUCTION" ? "https://api.transak.com" : "https://api-stg.transak.com";
const SESSION_BASE = ENV === "PRODUCTION" ? "https://api-gateway.transak.com" : "https://api-gateway-stg.transak.com";

// Access token is valid ~7 days (only one valid at a time) — cache per instance,
// refresh on expiry or a rejected session call.
let cached: { token: string; at: number } | null = null;
const TOKEN_TTL = 6 * 24 * 60 * 60 * 1000;

async function accessToken(apiKey: string, apiSecret: string, force = false): Promise<string> {
  if (!force && cached && Date.now() - cached.at < TOKEN_TTL) return cached.token;
  const res = await fetch(`${REFRESH_BASE}/partners/api/v2/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-secret": apiSecret },
    body: JSON.stringify({ apiKey }),
  });
  if (!res.ok) throw new Error(`refresh-token ${res.status}`);
  const json = await res.json();
  const token = json?.data?.accessToken ?? json?.accessToken;
  if (!token) throw new Error("no access token in response");
  cached = { token, at: Date.now() };
  return token;
}

async function createWidgetUrl(token: string, widgetParams: Record<string, unknown>): Promise<string | null> {
  const res = await fetch(`${SESSION_BASE}/api/v2/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "access-token": token },
    body: JSON.stringify({ widgetParams }),
  });
  if (res.status === 401 || res.status === 403) return null; // token likely stale → caller retries
  if (!res.ok) throw new Error(`session ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json?.data?.widgetUrl ?? json?.widgetUrl ?? null;
}

export async function POST(req: Request) {
  const apiKey = process.env.TRANSAK_API_KEY;
  const apiSecret = process.env.TRANSAK_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cash-out isn't configured yet" }, { status: 503 });
  }

  let body: { walletAddress?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const widgetParams: Record<string, unknown> = {
    apiKey,
    referrerDomain: req.headers.get("host") ?? "app.oxar.app",
    productsAvailed: "SELL",
    cryptoCurrencyCode: "USDC",
    network: "solana",
    fiatCurrency: "EUR",
    paymentMethod: "credit_debit_card",
    ...(body.walletAddress ? { walletAddress: body.walletAddress } : {}),
  };

  try {
    let token = await accessToken(apiKey, apiSecret);
    let widgetUrl = await createWidgetUrl(token, widgetParams);
    if (!widgetUrl) {
      // Stale token — force-refresh once and retry.
      token = await accessToken(apiKey, apiSecret, true);
      widgetUrl = await createWidgetUrl(token, widgetParams);
    }
    if (!widgetUrl) return NextResponse.json({ error: "Couldn't start cash-out" }, { status: 502 });
    return NextResponse.json({ widgetUrl });
  } catch (e) {
    cached = null;
    console.error("Transak session error:", e);
    return NextResponse.json({ error: "Cash-out is temporarily unavailable" }, { status: 502 });
  }
}
