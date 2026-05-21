import type { Chain, ProtocolMetadata } from "../types";

export interface TokenBalance {
  contractAddress: string;
  rawBalance: bigint;
  decimals: number;
}

export interface ChainAdapter {
  readonly chain: Chain;
  fetchTokenBalances(walletAddress: string, tokens: string[]): Promise<TokenBalance[]>;
  fetchNav(protocol: ProtocolMetadata): Promise<number>;
  fetchTvl(protocol: ProtocolMetadata): Promise<number>;
  fetchHolderCount(protocol: ProtocolMetadata): Promise<number>;
}
