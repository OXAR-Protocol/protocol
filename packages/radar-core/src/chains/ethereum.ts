import { Alchemy, Network } from "alchemy-sdk";

import { getProtocolByContract } from "../protocols/registry";
import type { Chain, ProtocolMetadata } from "../types";
import type { ChainAdapter, TokenBalance } from "./types";

export interface EthereumAdapterConfig {
  alchemyApiKey: string;
}

// v0.1 hardcoded NAVs — replaced by indexer reads in Phase 2.
// Refreshed weekly until protocol_snapshots table is populated.
const HARDCODED_NAVS: Readonly<Record<string, number>> = {
  "ondo-usdy": 1.10,
  "ondo-ousg": 110.85,
  "blackrock-buidl": 1.0,
  "maple-finance": 1.06,
  "centrifuge": 1.05,
  "backed-bib01": 5.41,
};

export class EthereumAdapter implements ChainAdapter {
  readonly chain: Chain = "ethereum";
  private readonly alchemy: Alchemy;

  constructor(config: EthereumAdapterConfig) {
    this.alchemy = new Alchemy({
      apiKey: config.alchemyApiKey,
      network: Network.ETH_MAINNET,
    });
  }

  async fetchTokenBalances(
    walletAddress: string,
    tokens: string[],
  ): Promise<TokenBalance[]> {
    if (tokens.length === 0) return [];

    const result = await this.alchemy.core.getTokenBalances(walletAddress, tokens);
    const balances: TokenBalance[] = [];

    for (const item of result.tokenBalances) {
      if (!item.tokenBalance || item.tokenBalance === "0x0") continue;

      const protocol = getProtocolByContract("ethereum", item.contractAddress);
      if (!protocol) continue;

      balances.push({
        contractAddress: item.contractAddress,
        rawBalance: BigInt(item.tokenBalance),
        decimals: protocol.decimals,
      });
    }

    return balances;
  }

  async fetchNav(protocol: ProtocolMetadata): Promise<number> {
    return HARDCODED_NAVS[protocol.slug] ?? 1.0;
  }

  async fetchTvl(_protocol: ProtocolMetadata): Promise<number> {
    // Phase 2: indexer populates protocol_snapshots.tvl from totalSupply * NAV
    return 0;
  }

  async fetchHolderCount(_protocol: ProtocolMetadata): Promise<number> {
    // Phase 2: indexer populates from Alchemy token-holders API
    return 0;
  }
}
