/**
 * Reading our own volume off the chain, one wallet at a time.
 *
 * The arithmetic lives in `@oxar/sdk` (`walletFlows`); this is the part that cannot:
 * which wallets to look at, where each one was last read to, and how to ask Helius
 * for the rest without spending the quota the app needs.
 *
 * Sequential on purpose. Helius rate-limits at a couple of requests a second and
 * paging already fires them back to back inside one wallet's read; running wallets
 * in parallel on top of that is how a page comes back truncated, and a truncated
 * history here is a volume figure that is quietly too small.
 */

import {
  walletFlows,
  totalVolume,
  newestTxTs,
  isOurs,
  KORA_FEE_PAYERS,
  type Attribution,
  type Flow,
} from "@oxar/sdk";

import { heliusApiKey, fetchHistoryPaged } from "@/lib/helius/history";
import { getSupabaseServer } from "@/lib/supabase-server";
import { CASH_MINTS } from "@/lib/yield/position-mints";

/** Page ceiling per wallet. 100 transactions a page — 40 covers a very busy year. */
const MAX_PAGES = 40;

/** A cursor is a moment, and block times and our clock are not the same clock. */
const CURSOR_SLACK_SEC = 60;

export interface WalletSyncResult {
  wallet: string;
  /** Flows written (or that would be, on a dry run) — everything the wallet did. */
  found: number;
  /** Of those, the ones that came through us. */
  ours: number;
  spentUsd: number;
  receivedUsd: number;
  /** History came back short — the cursor was left where it was. */
  incomplete: boolean;
  /** Why this wallet came back empty. Absent when it didn't. */
  error?: string;
}

/** What moved through OUR app. The headline figure; everything else is context. */
export interface Totals {
  spentUsd: number;
  receivedUsd: number;
  volumeUsd: number;
  transactions: number;
}

export interface SyncReport {
  wallets: WalletSyncResult[];
  /** Transactions we can prove we built. This is "our volume". */
  ours: Totals;
  /** Everything those wallets did anywhere, ours included — context, not our number. */
  all: Totals;
  /** Wallets whose read came back short and will be retried next run. */
  incomplete: number;
}

/**
 * Every wallet we know of: the ones already being synced, plus any that has ever
 * reached the client-side tracker. `events` is a poor source of AMOUNTS but a fine
 * source of addresses — a wallet lands there on login, before it has moved a cent.
 */
async function knownWallets(): Promise<string[]> {
  const supabase = getSupabaseServer();
  const [tracked, synced] = await Promise.all([
    supabase.from("events").select("wallet"),
    supabase.from("wallet_sync").select("wallet"),
  ]);
  const wallets = new Set<string>();
  for (const row of tracked.data ?? []) if (row.wallet) wallets.add(row.wallet as string);
  for (const row of synced.data ?? []) if (row.wallet) wallets.add(row.wallet as string);
  return [...wallets];
}

/**
 * The signatures our own client reported. Weaker evidence than the relayer — a
 * closed tab never reports — but it is never wrong in the other direction, so it
 * catches transactions a user paid their own gas for.
 */
async function recordedSigs(): Promise<Set<string>> {
  const supabase = getSupabaseServer();
  const { data } = await supabase.from("events").select("sig").not("sig", "is", null);
  const sigs = new Set<string>();
  for (const row of data ?? []) {
    const sig = row.sig as string | null;
    // Channel attribution stores a synthetic key, not a transaction.
    if (sig && !sig.startsWith("ch:")) sigs.add(sig);
  }
  return sigs;
}

/** Unix seconds we last read this wallet through, or undefined for a first read. */
async function cursorOf(wallet: string): Promise<number | undefined> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("wallet_sync")
    .select("synced_through")
    .eq("wallet", wallet)
    .maybeSingle();
  const through = data?.synced_through as string | null | undefined;
  if (!through) return undefined;
  const ms = Date.parse(through);
  if (Number.isNaN(ms)) return undefined;
  return Math.floor(ms / 1000) - CURSOR_SLACK_SEC;
}

async function writeFlows(wallet: string, flows: readonly Flow[]): Promise<void> {
  if (!flows.length) return;
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("wallet_flows").upsert(
    flows.map((f) => ({
      sig: f.sig,
      wallet,
      ts: new Date(f.ts * 1000).toISOString(),
      spent_usd: f.spentUsd,
      received_usd: f.receivedUsd,
      origin: f.origin,
    })),
    // Not `ignoreDuplicates`: a re-sync must be able to CORRECT a row. Attribution
    // improves over time — a transaction read before its event landed is `unknown`
    // on the first pass and `recorded` on the next — and a row that could only ever
    // be inserted would keep the first, worst answer forever.
    { onConflict: "sig" },
  );
  if (error) throw new Error(error.message);
}

/**
 * The cursor only moves on a complete read. A read that was rate-limited stopped
 * somewhere in the middle of the wallet's history; moving the cursor past it would
 * mark the gap as covered and never look at it again.
 */
async function writeCursor(wallet: string, through: number, incomplete: boolean): Promise<void> {
  const supabase = getSupabaseServer();
  const row: Record<string, unknown> = {
    wallet,
    synced_at: new Date().toISOString(),
    last_error: incomplete ? "history came back short — retrying next run" : null,
  };
  if (!incomplete && through > 0) row.synced_through = new Date(through * 1000).toISOString();
  await supabase.from("wallet_sync").upsert(row, { onConflict: "wallet" });
}

async function syncWallet(
  wallet: string,
  key: string,
  attribution: Attribution,
  dry: boolean,
): Promise<{ result: WalletSyncResult; flows: Flow[] }> {
  const since = await cursorOf(wallet);
  const { txs, failed } = await fetchHistoryPaged(wallet, key, MAX_PAGES, since);
  const flows = walletFlows(txs, wallet, CASH_MINTS, attribution);
  const mine = flows.filter(isOurs);
  const totals = totalVolume(mine);

  if (!dry) {
    await writeFlows(wallet, flows);
    // From the READ, not from what it found: a wallet that only ever transfers has
    // no flows, and a cursor taken from those would sit at zero and re-page the
    // whole history every night.
    await writeCursor(wallet, newestTxTs(txs) || (since ?? 0), failed);
  }

  return {
    result: {
      wallet,
      found: flows.length,
      ours: mine.length,
      spentUsd: totals.spentUsd,
      receivedUsd: totals.receivedUsd,
      incomplete: failed,
    },
    flows,
  };
}

/** Read every known wallet forward from where it was last read. */
export async function syncVolume(opts: { dry?: boolean } = {}): Promise<SyncReport> {
  const key = heliusApiKey();
  if (!key) throw new Error("Helius API key not configured");

  const attribution: Attribution = {
    relayers: KORA_FEE_PAYERS,
    recorded: await recordedSigs(),
  };

  const wallets = await knownWallets();
  const results: WalletSyncResult[] = [];
  // Deduped across wallets: a transaction between two wallets we know appears in
  // both histories, and counting it twice would inflate the one number this exists
  // to get right.
  const seen = new Map<string, Flow>();
  for (const wallet of wallets) {
    try {
      const { result, flows } = await syncWallet(wallet, key, attribution, opts.dry ?? false);
      results.push(result);
      for (const f of flows) if (!seen.has(f.sig)) seen.set(f.sig, f);
    } catch (e) {
      // Reported, not just logged. This job failed on every wallet once and said only
      // "incomplete", which reads as a rate limit; the cause was a thrown TypeError.
      // A silent zero is the failure mode this whole table exists to stop.
      const error = e instanceof Error ? e.message : String(e);
      console.error("[volume-sync] wallet failed", wallet, error);
      results.push({ wallet, found: 0, ours: 0, spentUsd: 0, receivedUsd: 0, incomplete: true, error });
    }
  }

  const every = [...seen.values()];
  const summarize = (flows: readonly Flow[]): Totals => {
    const t = totalVolume(flows);
    return {
      spentUsd: t.spentUsd,
      receivedUsd: t.receivedUsd,
      volumeUsd: t.volumeUsd,
      transactions: t.transactions,
    };
  };

  return {
    wallets: results,
    ours: summarize(every.filter(isOurs)),
    all: summarize(every),
    incomplete: results.filter((r) => r.incomplete).length,
  };
}
