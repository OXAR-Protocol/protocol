import { Program, Wallet } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import type { OxarProtocol } from "./types";
/**
 * Create an Anchor Program instance for the OXAR protocol.
 *
 * @param connection - Solana RPC connection
 * @param wallet - Optional wallet. If omitted, a read-only dummy wallet is
 *   used (sufficient for fetching accounts).
 */
export declare function createOxarProgram(connection: Connection, wallet?: Wallet): Program<OxarProtocol>;
