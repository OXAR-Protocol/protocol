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

import { walletFlows, totalVolume, newestTs, type Flow } from "@oxar/sdk";

import { heliusApiKey, fetchHistoryPaged } from "@/lib/helius/history";
import { getSupabaseServer } from "@/lib/supabase-server";
import { CASH_MINTS } from "@/lib/yield/position-mints";

/** Page ceiling per wallet. 100 transactions a page — 40 covers a very busy year. */
const MAX_PAGES = 40;

/** A cursor is a moment, and block times and our clock are not the same clock. */
const CURSOR_SLACK_SEC = 60;

export interface WalletSyncResult {
  wallet: string;
  /** Flows written (or that would be, on a dry run). */
  found: number;
  spentUsd: number;
  receivedUsd: number;
  /** History came back short — the cursor was left where it was. */
  incomplete: boolean;
}

export interface SyncReport {
  wallets: WalletSyncResult[];
  volumeUsd: number;
  spentUsd: number;
  receivedUsd: number;
  transactions: number;
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
    })),
    { onConflict: "sig", ignoreDuplicates: true },
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

async function syncWallet(wallet: string, key: string, dry: boolean): Promise<WalletSyncResult> {
  const since = await cursorOf(wallet);
  const { txs, failed } = await fetchHistoryPaged(wallet, key, MAX_PAGES, since);
  const flows = walletFlows(txs, wallet, CASH_MINTS);
  const totals = totalVolume(flows);

  if (!dry) {
    await writeFlows(wallet, flows);
    await writeCursor(wallet, newestTs(flows) || (since ?? 0), failed);
  }

  return {
    wallet,
    found: flows.length,
    spentUsd: totals.spentUsd,
    receivedUsd: totals.receivedUsd,
    incomplete: failed,
  };
}

/** Read every known wallet forward from where it was last read. */
export async function syncVolume(opts: { dry?: boolean } = {}): Promise<SyncReport> {
  const key = heliusApiKey();
  if (!key) throw new Error("Helius API key not configured");

  const wallets = await knownWallets();
  const results: WalletSyncResult[] = [];
  for (const wallet of wallets) {
    try {
      results.push(await syncWallet(wallet, key, opts.dry ?? false));
    } catch (e) {
      console.error("[volume-sync] wallet failed", wallet, e);
      results.push({ wallet, found: 0, spentUsd: 0, receivedUsd: 0, incomplete: true });
    }
  }

  const spentUsd = results.reduce((n, r) => n + r.spentUsd, 0);
  const receivedUsd = results.reduce((n, r) => n + r.receivedUsd, 0);
  return {
    wallets: results,
    spentUsd,
    receivedUsd,
    volumeUsd: spentUsd + receivedUsd,
    transactions: results.reduce((n, r) => n + r.found, 0),
    incomplete: results.filter((r) => r.incomplete).length,
  };
}
