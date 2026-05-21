import type { ProtocolMetadata } from "../types";

export interface FetcherContext {
  alchemyApiKey: string;
  heliusApiKey?: string;
}

export interface SnapshotResult {
  nav: number;
  tvl: number | null;
  holderCount: number | null;
  apyBps: number | null;
  top10ConcentrationPct: number | null;
  redemptionQueueUsd: number | null;
}

export interface ProtocolFetcher {
  /** Protocol slug this fetcher handles. */
  readonly slug: string;
  /** Run the fetcher against live infrastructure and return one snapshot row. */
  fetch(protocol: ProtocolMetadata, ctx: FetcherContext): Promise<SnapshotResult>;
}
