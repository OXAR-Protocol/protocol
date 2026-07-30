import { NextResponse } from "next/server";

// Server-side proxy for Delora's cross-chain quote. Keeps DELORA_API_KEY off the
// client; the client posts the bridge params, we add key/integrator/fee/slippage.

const SLIPPAGE = "0.005"; // 0.5%

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export async function POST(req: Request) {
  const key = process.env.DELORA_API_KEY;
  const base = process.env.NEXT_PUBLIC_DELORA_BASE_URL || "https://api.delora.build/v1";
  // Kept: Delora's analytics (volume, transactions, unique users) hang off the
  // integrator, not off the fee — so zeroing the markup below costs us no
  // measurement.
  const integrator = process.env.DELORA_INTEGRATOR || "oxarforoxar";
  /**
   * Delora's `fee` is a FRACTION (0–0.1), not basis points. It was 0.001 — a 0.1%
   * markup on every cross-chain bridge, and it really was ours: the partner
   * portal shows it accruing to our payout wallets. All-time it earned $0.16, on
   * $162.81 of volume, from one user who was us testing.
   *
   * Sixteen cents is not a monetisation strategy, and it was bought with the one
   * claim a trust product can't easily re-earn — that we take nothing — charged on
   * the very path we built to make arriving easy. So: zero.
   *
   * Deliberately NOT read from an env var. A charge on someone else's money should
   * not be flippable by a dashboard field nobody reviews; turning it back on
   * should cost a commit and a read.
   */
  const fee = "0";
  if (!key) return NextResponse.json({ error: "Bridge unavailable" }, { status: 503 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { senderAddress, originChainId, destinationChainId, amount, originCurrency, destinationCurrency, receiverAddress } = body;
  if (
    !isStr(senderAddress) || !isNum(originChainId) || !isNum(destinationChainId) ||
    !isStr(amount) || !isStr(originCurrency) || !isStr(destinationCurrency) || !isStr(receiverAddress)
  ) {
    return NextResponse.json({ error: "Invalid bridge params" }, { status: 400 });
  }

  const qs = new URLSearchParams({
    senderAddress,
    originChainId: String(originChainId),
    destinationChainId: String(destinationChainId),
    amount,
    originCurrency,
    destinationCurrency,
    receiverAddress,
    integrator,
    fee,
    slippage: SLIPPAGE,
  });

  try {
    const res = await fetch(`${base}/quotes?${qs.toString()}`, {
      headers: { "x-api-key": key },
    });
    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: json?.message || "No bridge route found" },
        { status: res.status === 404 ? 422 : 502 },
      );
    }
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ error: "Bridge quote failed" }, { status: 502 });
  }
}
