import "server-only";

import type { SnapshotRow } from "@oxar/radar-core";

import { getDb } from "./client";

export async function insertSnapshots(rows: SnapshotRow[]): Promise<void> {
  if (rows.length === 0) return;

  const sql = getDb();
  const payload = rows.map((row) => ({
    protocol_id: row.protocolId,
    ts: row.capturedAt.toISOString(),
    nav: row.nav,
    tvl: row.tvl,
    holder_count: row.holderCount,
    apy_bps: row.apyBps,
    top10_concentration_pct: row.top10ConcentrationPct,
    redemption_queue_usd: row.redemptionQueueUsd,
  }));

  await sql`
    insert into radar.protocol_snapshots ${sql(
      payload,
      "protocol_id",
      "ts",
      "nav",
      "tvl",
      "holder_count",
      "apy_bps",
      "top10_concentration_pct",
      "redemption_queue_usd",
    )}
  `;
}

export interface LatestSnapshot {
  ts: string;
  nav: number | null;
  tvl: number | null;
  holderCount: number | null;
  apyBps: number | null;
  top10ConcentrationPct: number | null;
  redemptionQueueUsd: number | null;
}

interface SnapshotRowDb {
  ts: Date;
  nav: string | null;
  tvl: string | null;
  holder_count: number | null;
  apy_bps: number | null;
  top10_concentration_pct: string | null;
  redemption_queue_usd: string | null;
}

export async function getLatestSnapshot(protocolId: string): Promise<LatestSnapshot | null> {
  const sql = getDb();
  const rows = await sql<SnapshotRowDb[]>`
    select ts, nav, tvl, holder_count, apy_bps,
           top10_concentration_pct, redemption_queue_usd
    from radar.protocol_snapshots
    where protocol_id = ${protocolId}
    order by ts desc
    limit 1
  `;
  if (rows.length === 0) return null;

  const row = rows[0]!;
  return {
    ts: row.ts.toISOString(),
    nav: row.nav !== null ? Number(row.nav) : null,
    tvl: row.tvl !== null ? Number(row.tvl) : null,
    holderCount: row.holder_count,
    apyBps: row.apy_bps,
    top10ConcentrationPct:
      row.top10_concentration_pct !== null ? Number(row.top10_concentration_pct) : null,
    redemptionQueueUsd:
      row.redemption_queue_usd !== null ? Number(row.redemption_queue_usd) : null,
  };
}
