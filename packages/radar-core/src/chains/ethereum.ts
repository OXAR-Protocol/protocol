import { getProtocolByContract } from "../protocols/registry";
import type { Chain, ProtocolMetadata } from "../types";
import type { ChainAdapter, TokenBalance } from "./types";

const ALCHEMY_MAINNET_URL = "https://eth-mainnet.g.alchemy.com/v2";

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

interface AlchemyTokenBalance {
  contractAddress: string;
  tokenBalance: string | null;
}

interface AlchemyTokenBalancesResult {
  address: string;
  tokenBalances: AlchemyTokenBalance[];
}

interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id: number;
  result?: T;
  error?: { code: number; message: string };
}

export interface EthereumAdapterConfig {
  alchemyApiKey: string;
}

export class EthereumAdapter implements ChainAdapter {
  readonly chain: Chain = "ethereum";
  private readonly rpcUrl: string;

  constructor(config: EthereumAdapterConfig) {
    this.rpcUrl = `${ALCHEMY_MAINNET_URL}/${config.alchemyApiKey}`;
  }

  async fetchTokenBalances(
    walletAddress: string,
    tokens: string[],
  ): Promise<TokenBalance[]> {
    if (tokens.length === 0) return [];

    const result = await this.rpcCall<AlchemyTokenBalancesResult>(
      "alchemy_getTokenBalances",
      [walletAddress, tokens],
    );

    const balances: TokenBalance[] = [];

    for (const item of result.tokenBalances) {
      if (!item.tokenBalance) continue;
      const raw = hexToBigInt(item.tokenBalance);
      if (raw === 0n) continue;

      const protocol = getProtocolByContract("ethereum", item.contractAddress);
      if (!protocol) continue;

      balances.push({
        contractAddress: item.contractAddress,
        rawBalance: raw,
        decimals: protocol.decimals,
      });
    }

    return balances;
  }

  async fetchNav(protocol: ProtocolMetadata): Promise<number> {
    return HARDCODED_NAVS[protocol.slug] ?? 1.0;
  }

  async fetchTvl(_protocol: ProtocolMetadata): Promise<number> {
    return 0;
  }

  async fetchHolderCount(_protocol: ProtocolMetadata): Promise<number> {
    return 0;
  }

  private async rpcCall<T>(method: string, params: unknown[]): Promise<T> {
    const response = await fetch(this.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: 1, jsonrpc: "2.0", method, params }),
    });

    if (!response.ok) {
      throw new Error(`Alchemy RPC ${method} returned HTTP ${response.status}`);
    }

    const data = (await response.json()) as JsonRpcResponse<T>;
    if (data.error) {
      throw new Error(`Alchemy RPC ${method} error: ${data.error.message}`);
    }
    if (data.result === undefined) {
      throw new Error(`Alchemy RPC ${method} returned no result`);
    }

    return data.result;
  }
}

function hexToBigInt(hex: string): bigint {
  if (hex === "0x" || hex === "0x0") return 0n;
  return BigInt(hex);
}
