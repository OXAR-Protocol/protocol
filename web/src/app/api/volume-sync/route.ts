import { NextRequest, NextResponse } from "next/server";

import { snapshotAum } from "@/lib/analytics/aum";
import { knownWallets, syncVolume } from "@/lib/analytics/volume-sync";

/**
 * The nightly read of the two figures that answer different questions.
 *
 * FLOW — what moved through us, from the transactions themselves.
 * STOCK — what is still held, from the balances, priced today.
 *
 * Both, because volume alone is ambiguous where it matters: $1,000 of it is $1,000
 * that arrived and stayed, or $100 that went in and out five times, and for a yield
 * product those are opposite outcomes. They run in one job against one wallet list,
 * so the two figures can never disagree about who was counted.
 *
 * Runs on a schedule rather than on a page view: the cost is one Helius request per
 * wallet per night, against the twenty-five a single visit to `/you` can spend. It
 * is not a user-facing route and never runs on the money path.
 *
 * It reads whole wallets and then marks each transaction with how we know it was
 * ours, rather than reading less. The wallet's other activity is what makes the
 * ratio legible — "we saw $1,597 of $1,924" is a fact about our coverage, and
 * dropping those rows would leave no way to notice coverage getting worse.
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
    const volume = await syncVolume({ dry });
    // One timestamp for the whole snapshot: a balance is a fact about a moment, and
    // stamping each row as it is written would smear one photograph across the run.
    const takenAt = new Date().toISOString();
    const aum = await snapshotAum(await knownWallets(), { dry, takenAt });
    return NextResponse.json({ ok: true, dry, volume, aum });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "sync failed";
    console.error("[volume-sync] failed:", reason);
    return NextResponse.json({ error: reason }, { status: 500 });
  }
}
