import type { ProtocolMetadata } from "../types";
import { EthereumGenericFetcher } from "./ethereum-generic";
import type { FetcherContext, ProtocolFetcher, SnapshotResult } from "./types";

const ETHEREUM_GENERIC = new EthereumGenericFetcher();

/**
 * Per-slug fetcher overrides. Falls back to the generic fetcher when
 * no override is registered. Phase 2.2.3 wires in Ondo API, Maple
 * subgraph, Centrifuge GraphQL as overrides.
 */
const OVERRIDES = new Map<string, ProtocolFetcher>();

export function registerFetcher(fetcher: ProtocolFetcher): void {
  OVERRIDES.set(fetcher.slug, fetcher);
}

export interface SnapshotRow extends SnapshotResult {
  protocolId: string;
  protocolSlug: string;
  capturedAt: Date;
}

export interface SnapshotJobInput {
  protocols: Array<ProtocolMetadata & { id: string }>;
  ctx: FetcherContext;
}

export interface SnapshotJobResult {
  rows: SnapshotRow[];
  errors: Array<{ protocolSlug: string; message: string }>;
}

export async function runSnapshotJob(input: SnapshotJobInput): Promise<SnapshotJobResult> {
  const rows: SnapshotRow[] = [];
  const errors: SnapshotJobResult["errors"] = [];
  const capturedAt = new Date();

  for (const protocol of input.protocols) {
    const fetcher = OVERRIDES.get(protocol.slug) ?? defaultFetcherFor(protocol);
    if (!fetcher) {
      errors.push({
        protocolSlug: protocol.slug,
        message: `No fetcher available for chain ${protocol.chain}`,
      });
      continue;
    }

    try {
      const result = await fetcher.fetch(protocol, input.ctx);
      rows.push({
        protocolId: protocol.id,
        protocolSlug: protocol.slug,
        capturedAt,
        ...result,
      });
    } catch (err) {
      errors.push({
        protocolSlug: protocol.slug,
        message: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { rows, errors };
}

function defaultFetcherFor(protocol: ProtocolMetadata): ProtocolFetcher | undefined {
  if (protocol.chain === "ethereum") return ETHEREUM_GENERIC;
  // Solana generic fetcher lands in Phase 2.2.5 alongside the OXAR mainnet
  // tokens being added to the registry.
  return undefined;
}
