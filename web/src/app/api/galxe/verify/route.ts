import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

// Galxe "REST API" credential calls this endpoint with the participant's
// connected wallet and expects a parseable eligibility flag. Configure the
// credential's response expression to read `$.eligible`.
//
//   GET /api/galxe/verify?address=<base58 Solana address>
//   -> { "address": "...", "eligible": true | false }
//
// A wallet is eligible when it is attached to a waitlist signup.
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("address")?.trim() ?? "";

  let address: string;
  try {
    address = new PublicKey(raw).toBase58();
  } catch {
    return NextResponse.json({ address: raw, eligible: false, error: "Invalid address" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("waitlist")
    .select("serial")
    .eq("wallet", address)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ address, eligible: false, error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ address, eligible: !!data });
}
