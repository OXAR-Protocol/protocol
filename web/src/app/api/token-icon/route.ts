import { NextResponse } from "next/server";

// Resolve a token logo from CoinGecko when our primary sources (DAS / Jupiter /
// Alchemy) have none or a dead URL. Keeps any CoinGecko key off the client and
// caches results per server instance so we never hammer the rate limit.

const CG = "https://api.coingecko.com/api/v3";
// Trim the (otherwise ~130KB) coin payload down to just the image.
const SLIM =
  "localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false";

// Alchemy network id → CoinGecko asset-platform id.
const PLATFORM: Record<string, string> = {
  "eth-mainnet": "ethereum",
  "base-mainnet": "base",
  "arb-mainnet": "arbitrum-one",
  "opt-mainnet": "optimistic-ethereum",
  "matic-mainnet": "polygon-pos",
};
// Native EVM coin symbol → CoinGecko coin id.
const NATIVE_ID: Record<string, string> = { ETH: "ethereum", POL: "matic-network", MATIC: "matic-network" };
const EVM_NATIVE = "0x0000000000000000000000000000000000000000";

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
  let body: { chain?: string; network?: string; mint?: string; symbol?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  const { chain, network, mint, symbol } = body;
  if (typeof mint !== "string" || !mint) {
    return NextResponse.json({ error: "mint required" }, { status: 400 });
  }

  const ckey = `${chain}:${network ?? ""}:${mint}`;
  if (cache.has(ckey)) return NextResponse.json({ icon: cache.get(ckey) });

  let icon: string | null = null;
  try {
    if (chain === "ethereum") {
      if (mint === EVM_NATIVE) {
        const id = NATIVE_ID[(symbol ?? "ETH").toUpperCase()] ?? "ethereum";
        icon = await cgImage(`/coins/${id}?${SLIM}`);
      } else {
        const platform = PLATFORM[network ?? ""] ?? "ethereum";
        icon = await cgImage(`/coins/${platform}/contract/${mint}`);
      }
    } else {
      icon = await cgImage(`/coins/solana/contract/${mint}`);
    }
  } catch {
    icon = null;
  }

  cache.set(ckey, icon);
  return NextResponse.json(
    { icon },
    { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}
