import { Connection, PublicKey } from "@solana/web3.js";

import { getProtocolByContract } from "../protocols/registry";
import type { Chain, ProtocolMetadata } from "../types";
import type { ChainAdapter, TokenBalance } from "./types";

const SPL_TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);

// Token-2022 program (TransferHook etc). Some RWA-on-Solana issuers may use
// this newer program — we query both for completeness.
const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);

// v0.1 hardcoded NAVs. Once Solana mints are in the registry the indexer
// will replace this map.
const HARDCODED_NAVS: Readonly<Record<string, number>> = {};

export interface SolanaAdapterConfig {
  /** Helius API key. Used to build a mainnet RPC URL. */
  heliusApiKey: string;
  /** Optional override (for testing). If set, takes precedence over heliusApiKey. */
  rpcUrl?: string;
}

export class SolanaAdapter implements ChainAdapter {
  readonly chain: Chain = "solana";
  private readonly connection: Connection;

  constructor(config: SolanaAdapterConfig) {
    const url =
      config.rpcUrl ?? `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;
    this.connection = new Connection(url, "confirmed");
  }

  async fetchTokenBalances(
    walletAddress: string,
    tokens: string[],
  ): Promise<TokenBalance[]> {
    if (tokens.length === 0) return [];

    const owner = new PublicKey(walletAddress);
    const mintFilter = new Set(tokens.map((t) => t));

    const accounts = await this.fetchAllParsedTokenAccounts(owner);
    const balances: TokenBalance[] = [];

    for (const account of accounts) {
      const info = account.account.data.parsed?.info;
      if (!info || typeof info.mint !== "string") continue;
      if (!mintFilter.has(info.mint)) continue;

      const protocol = getProtocolByContract("solana", info.mint);
      if (!protocol) continue;

      const raw = info.tokenAmount?.amount;
      if (typeof raw !== "string" || raw === "0") continue;

      balances.push({
        contractAddress: info.mint,
        rawBalance: BigInt(raw),
        decimals: protocol.decimals,
      });
    }

    return balances;
  }

  async fetchNav(protocol: ProtocolMetadata): Promise<number> {
    return HARDCODED_NAVS[protocol.slug] ?? 1.0;
  }

  async fetchTvl(_protocol: ProtocolMetadata): Promise<number> {
    // Phase 2: indexer reads mint supply and multiplies by NAV.
    return 0;
  }

  async fetchHolderCount(_protocol: ProtocolMetadata): Promise<number> {
    // Phase 2: indexer reads token-account count from Helius enhanced API.
    return 0;
  }

  private async fetchAllParsedTokenAccounts(owner: PublicKey) {
    const [splResult, t22Result] = await Promise.all([
      this.connection.getParsedTokenAccountsByOwner(owner, {
        programId: SPL_TOKEN_PROGRAM_ID,
      }),
      this.connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_2022_PROGRAM_ID,
      }),
    ]);
    return [...splResult.value, ...t22Result.value];
  }
}
