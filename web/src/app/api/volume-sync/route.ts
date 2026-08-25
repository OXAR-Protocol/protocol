import { NextRequest, NextResponse } from "next/server";

import { syncVolume } from "@/lib/analytics/volume-sync";

/**
 * The nightly read of what actually moved.
 *
 * Runs on a schedule rather than on a page view: the cost is one Helius request per
 * wallet per night, against the twenty-five a single visit to `/you` can spend. It
 * is not a user-facing route and never runs on the money path.
 *
 * Guarded by `CRON_SECRET` — Vercel Cron sends it as a bearer token. Without the env
 * set the route refuses everyone, including the cron, which is the safe direction to
 * fail: an unguarded endpoint that pages Helius is a way to burn the quota.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Wallets are read one at a time; give the job room to finish. */
export const maxDuration = 300;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // `?dry=1` reads and reports without writing — for checking the figures against a
  // block explorer before they become the numbers we quote.
  const dry = req.nextUrl.searchParams.get("dry") === "1";
  try {
    const report = await syncVolume({ dry });
    return NextResponse.json({ ok: true, dry, ...report });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "sync failed";
    console.error("[volume-sync] failed:", reason);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
