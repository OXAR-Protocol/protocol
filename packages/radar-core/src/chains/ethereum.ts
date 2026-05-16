import type { Chain, ProtocolMetadata } from "../types";
import type { ChainAdapter, TokenBalance } from "./types";

export interface EthereumAdapterConfig {
  alchemyApiKey: string;
  network?: "mainnet";
}

export class EthereumAdapter implements ChainAdapter {
  readonly chain: Chain = "ethereum";

  constructor(_config: EthereumAdapterConfig) {}

  async fetchTokenBalances(
    _walletAddress: string,
    _tokens: string[],
  ): Promise<TokenBalance[]> {
    throw new Error("EthereumAdapter.fetchTokenBalances: not implemented (Day 3-5)");
  }

  async fetchNav(_protocol: ProtocolMetadata): Promise<number> {
    throw new Error("EthereumAdapter.fetchNav: not implemented (Day 3-5)");
  }

  async fetchTvl(_protocol: ProtocolMetadata): Promise<number> {
    throw new Error("EthereumAdapter.fetchTvl: not implemented (Day 3-5)");
  }

  async fetchHolderCount(_protocol: ProtocolMetadata): Promise<number> {
    throw new Error("EthereumAdapter.fetchHolderCount: not implemented (Day 3-5)");
  }
}
