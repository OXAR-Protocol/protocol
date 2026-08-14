import { NextResponse } from "next/server";

// Resolve a token logo from CoinGecko when our primary sources (DAS / Jupiter) have
// none or a dead URL. Keeps any CoinGecko key off the client and caches results per
// server instance so we never hammer the rate limit.
//
// Solana only. It used to branch on chain and look contracts up per EVM platform,
// for wallet assets that could be on Base or Arbitrum — those balances stopped being
// read when the app went Solana-only, so every request that reaches this arrives with
// a Solana mint.

const CG = "https://api.coingecko.com/api/v3";


// Cache resolved icons (and misses, as null) for the instance lifetime.
const cache = new Map<string, string | null>();

async function cgImage(path: string): Promise<string | null> {
  const key = process.env.COINGECKO_API_KEY;
  const res = await fetch(`${CG}${path}`, {
    headers: key ? { "x-cg-demo-api-key": key } : {},
  });
  if (!res.ok) return null;
  const d = (await res.json()) as { image?: { small?: string; large?: string; thumb?: string } };
  return d?.image?.small ?? d?.image?.large ?? d?.image?.thumb ?? null;
}

export async function POST(req: Request) {
  let body: { chain?: string; network?: string; mint?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { chain, network, mint } = body;
  if (typeof mint !== "string" || !mint) {
    return NextResponse.json({ error: "mint required" }, { status: 400 });
  }

  const ckey = `${chain}:${network ?? ""}:${mint}`;
  if (cache.has(ckey)) return NextResponse.json({ icon: cache.get(ckey) });

  let icon: string | null = null;
  try {
    icon = await cgImage(`/coins/solana/contract/${mint}`);
  } catch {
    icon = null;
  }

  cache.set(ckey, icon);
  return NextResponse.json(
    { icon },
    { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}
