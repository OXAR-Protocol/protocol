import { NextResponse } from "next/server";

// EVM networks we scan for pay-with-any-crypto. Add Alchemy network ids here to
// support more chains — no other code change needed.
const NETWORKS = [
  "eth-mainnet",
  "base-mainnet",
  "arb-mainnet",
  "opt-mainnet",
  "matic-mainnet",
];

const isEvmAddress = (a: unknown): a is string =>
  typeof a === "string" && /^0x[0-9a-fA-F]{40}$/.test(a);

/**
 * Server-side proxy for Alchemy's multi-network token portfolio. Keeps the
 * Alchemy key off the client; returns the raw `tokens` array (all strings, so
 * JSON-safe) — the client turns it into WalletAssets via `buildEvmAssets`.
 */
export async function POST(req: Request) {
  const key = process.env.ALCHEMY_API_KEY;
  if (!key) return NextResponse.json({ error: "EVM balances unavailable" }, { status: 503 });

  let address: unknown;
  try {
    ({ address } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (!isEvmAddress(address)) {
    return NextResponse.json({ error: "Invalid EVM address" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://api.g.alchemy.com/data/v1/${key}/assets/tokens/by-address`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addresses: [{ address, networks: NETWORKS }],
          withMetadata: true,
          withPrices: true,
          includeNativeTokens: true,
        }),
      },
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Alchemy request failed" }, { status: 502 });
    }
    const json = await res.json();
    // First page only — dust/spam is filtered client-side and we surface top holdings.
    return NextResponse.json({ tokens: json?.data?.tokens ?? [] });
  } catch {
    return NextResponse.json({ error: "Alchemy request failed" }, { status: 502 });
  }
}
