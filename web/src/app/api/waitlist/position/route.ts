import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { normalizeRefCode, fetchRank } from "@/lib/waitlist-referral";

export const runtime = "nodejs";

// Fresh queue standing for a returning visitor (their ref_code is in localStorage).
export async function GET(req: NextRequest) {
  const code = normalizeRefCode(req.nextUrl.searchParams.get("code"));
  if (!code) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const supabase = getSupabaseServer();
  const rank = await fetchRank(supabase, code);
  if (!rank) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(rank);
}
