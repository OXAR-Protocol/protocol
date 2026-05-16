import type { Chain, ProtocolMetadata } from "../types";
import type { ChainAdapter, TokenBalance } from "./types";

export interface SolanaAdapterConfig {
  heliusApiKey: string;
  network?: "mainnet-beta";
}

export class SolanaAdapter implements ChainAdapter {
  readonly chain: Chain = "solana";

  constructor(_config: SolanaAdapterConfig) {}

  async fetchTokenBalances(
    _walletAddress: string,
    _tokens: string[],
  ): Promise<TokenBalance[]> {
    throw new Error("SolanaAdapter.fetchTokenBalances: not implemented (Day 12-14)");
  }

  async fetchNav(_protocol: ProtocolMetadata): Promise<number> {
    throw new Error("SolanaAdapter.fetchNav: not implemented (Day 12-14)");
  }

  async fetchTvl(_protocol: ProtocolMetadata): Promise<number> {
    throw new Error("SolanaAdapter.fetchTvl: not implemented (Day 12-14)");
  }

  async fetchHolderCount(_protocol: ProtocolMetadata): Promise<number> {
    throw new Error("SolanaAdapter.fetchHolderCount: not implemented (Day 12-14)");
  }
}
