import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { OxarProtocol, IDL } from "./types";
import { PROGRAM_ID } from "./constants";

/**
 * Create a read-only dummy wallet for use when no wallet is provided.
 * This allows fetching on-chain account data without signing.
 */
function createReadOnlyWallet(): Wallet {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey,
    signTransaction: async (tx: any) => tx,
    signAllTransactions: async (txs: any) => txs,
    payer: keypair,
  } as unknown as Wallet;
}

/**
 * Create an Anchor Program instance for the OXAR protocol.
 *
 * @param connection - Solana RPC connection
 * @param wallet - Optional wallet (Anchor Wallet interface). If omitted, a
 *   read-only dummy wallet is used (sufficient for fetching accounts).
 * @returns Program<OxarProtocol>
 */
export function createOxarProgram(
  connection: Connection,
  wallet?: Wallet
): Program<OxarProtocol> {
  const w = wallet ?? createReadOnlyWallet();
  const provider = new AnchorProvider(connection, w, {
    commitment: "confirmed",
  });
  return new Program<OxarProtocol>(IDL as any, provider);
}
