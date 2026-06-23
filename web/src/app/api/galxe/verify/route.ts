import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getSupabaseServer } from "@/lib/supabase-server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Galxe quest verification: is this person on the OXAR waitlist?
// The public site collects email only; wallets come from Galxe's side. So we
// verify by whatever Galxe can pass — email (preferred) and/or wallet address.
// Configure the credential's response expression to read `$.eligible`.
//
//   GET /api/galxe/verify?email=<email>
//   GET /api/galxe/verify?address=<base58 Solana address>
//   -> { "eligible": true | false }
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase() ?? "";
  const rawAddr = req.nextUrl.searchParams.get("address")?.trim() ?? "";

  let address = "";
  if (rawAddr) {
    try {
      address = new PublicKey(rawAddr).toBase58();
    } catch {
      return NextResponse.json({ eligible: false, error: "Invalid address" }, { status: 400 });
    }
  }

  const hasEmail = EMAIL_RE.test(email);
  if (!hasEmail && !address) {
    return NextResponse.json({ eligible: false, error: "Provide email or address" }, { status: 400 });
  }

  const supabase = getSupabaseServer();
  let query = supabase.from("waitlist").select("serial");
  // Match on whichever identifier(s) Galxe sent. `or` keeps it a single round-trip.
  if (hasEmail && address) {
    query = query.or(`email.eq.${email},wallet.eq.${address}`);
  } else if (hasEmail) {
    query = query.eq("email", email);
  } else {
    query = query.eq("wallet", address);
  }

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    return NextResponse.json({ eligible: false, error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ eligible: !!data });
}
