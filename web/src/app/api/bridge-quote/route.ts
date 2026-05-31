import { NextResponse } from "next/server";

// Server-side proxy for Delora's cross-chain quote. Keeps DELORA_API_KEY off the
// client; the client posts the bridge params, we add key/integrator/fee/slippage.

const SLIPPAGE = "0.005"; // 0.5%

const isStr = (v: unknown): v is string => typeof v === "string" && v.length > 0;
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export async function POST(req: Request) {
  const key = process.env.DELORA_API_KEY;
  const base = process.env.NEXT_PUBLIC_DELORA_BASE_URL || "https://api.delora.build/v1";
  const integrator = process.env.DELORA_INTEGRATOR || "oxarforoxar";
  const fee = process.env.DELORA_FEE_BPS || "0.001";
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
