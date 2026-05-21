import type { ProtocolMetadata } from "../types";
import type { FetcherContext, ProtocolFetcher, SnapshotResult } from "./types";

// v0.1 NAV map — replaced by per-protocol on-chain reads in Phase 2.2.3.
// Refreshed weekly from issuer disclosures.
const NAV_MAP: Readonly<Record<string, number>> = {
  "ondo-usdy": 1.10,
  "ondo-ousg": 110.85,
  "blackrock-buidl": 1.0,
  "maple-finance": 1.06,
  "centrifuge": 1.05,
  "backed-bib01": 5.41,
};

const TOTAL_SUPPLY_SELECTOR = "0x18160ddd"; // keccak256("totalSupply()")[:4]
const ALCHEMY_MAINNET = "https://eth-mainnet.g.alchemy.com/v2";

/**
 * Generic Ethereum ERC-20 protocol fetcher.
 *
 * Reads on-chain totalSupply via eth_call, multiplies by the static NAV
 * to derive TVL in USD. APY comes from the protocol's metadata. Holder
 * count and concentration are left null until the Alchemy Token API
 * holder endpoint is wired up in Phase 2.2.4.
 *
 * Per-protocol overrides (Ondo API, Maple subgraph, Centrifuge GraphQL)
 * land as separate fetcher classes that take precedence when registered.
 */
export class EthereumGenericFetcher implements ProtocolFetcher {
  readonly slug = "__ethereum_generic__";

  async fetch(
    protocol: ProtocolMetadata,
    ctx: FetcherContext,
  ): Promise<SnapshotResult> {
    if (protocol.chain !== "ethereum") {
      throw new Error(`EthereumGenericFetcher cannot handle chain ${protocol.chain}`);
    }

    const nav = NAV_MAP[protocol.slug] ?? null;
    const totalSupplyRaw = await readTotalSupply(protocol.contractAddress, ctx.alchemyApiKey);
    const totalSupply = Number(totalSupplyRaw) / 10 ** protocol.decimals;
    const tvl = nav !== null ? totalSupply * nav : null;

    return {
      nav: nav ?? 0,
      tvl,
      holderCount: null,
      apyBps: protocol.estimatedApyBps,
      top10ConcentrationPct: null,
      redemptionQueueUsd: null,
    };
  }
}

async function readTotalSupply(contractAddress: string, apiKey: string): Promise<bigint> {
  const response = await fetch(`${ALCHEMY_MAINNET}/${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "eth_call",
      params: [
        { to: contractAddress, data: TOTAL_SUPPLY_SELECTOR },
        "latest",
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`eth_call totalSupply returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: string;
    error?: { message: string };
  };

  if (data.error) throw new Error(`eth_call error: ${data.error.message}`);
  if (!data.result) throw new Error("eth_call returned no result");
  if (data.result === "0x") return 0n;

  return BigInt(data.result);
}
