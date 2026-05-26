"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets as useSolanaWallets, useCreateWallet as useCreateSolanaWallet } from "@privy-io/react-auth/solana";
import { IDL as idlJson, type OxarProtocol } from "@oxar/sdk";
import { RPC_URL } from "@/lib/constants";
import { clearCache } from "@/lib/cache";

interface SolanaContextValue {
  connection: Connection;
  program: Program<OxarProtocol> | null;
  provider: AnchorProvider | null;
  walletAddress: PublicKey | null;
  walletError: string | null;
  retryCreateWallet: () => void;
}

const SolanaContext = createContext<SolanaContextValue>({
  connection: new Connection(RPC_URL),
  program: null,
  provider: null,
  walletAddress: null,
  walletError: null,
  retryCreateWallet: () => {},
});

export function useSolanaContext() {
  return useContext(SolanaContext);
}

class ReadOnlyWallet {
  private _publicKey: PublicKey;
  constructor(pubkey?: PublicKey) {
    this._publicKey = pubkey || Keypair.generate().publicKey;
  }
  get publicKey(): PublicKey {
    return this._publicKey;
  }
  async signTransaction<T extends Transaction | VersionedTransaction>(_tx: T): Promise<T> {
    throw new Error("Please connect your wallet to sign transactions.");
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(_txs: T[]): Promise<T[]> {
    throw new Error("Please connect your wallet to sign transactions.");
  }
}

// SAFETY: Privy wallet shape is opaque across versions — interface is stable for signTransaction.
interface PrivyWalletLike {
  signTransaction(args: { transaction: Uint8Array; chain?: string }): Promise<{ signedTransaction: Uint8Array }>;
  address: string;
}

class PrivySolanaAdapter {
  private _publicKey: PublicKey;
  private _wallet: PrivyWalletLike;
  private _connection: Connection;

  constructor(pubkey: PublicKey, wallet: PrivyWalletLike, connection: Connection) {
    this._publicKey = pubkey;
    this._wallet = wallet;
    this._connection = connection;
  }

  get publicKey(): PublicKey {
    return this._publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    let txBytes: Uint8Array;

    if (tx instanceof Transaction) {
      if (!tx.recentBlockhash) {
        const { blockhash } = await this._connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
      }
      if (!tx.feePayer) {
        tx.feePayer = this._publicKey;
      }
      txBytes = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    } else {
      txBytes = (tx as VersionedTransaction).serialize();
    }

    const result = await this._wallet.signTransaction({
      transaction: txBytes,
      chain: "solana:devnet",
    });

    if (tx instanceof Transaction) {
      return Transaction.from(result.signedTransaction) as T;
    }
    return VersionedTransaction.deserialize(result.signedTransaction) as T;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    const signed: T[] = [];
    for (const tx of txs) {
      signed.push(await this.signTransaction(tx));
    }
    return signed;
  }
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), []);
  const { authenticated, user } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  const { createWallet: createSolanaWallet } = useCreateSolanaWallet();

  const [walletError, setWalletError] = useState<string | null>(null);
  const creatingWalletRef = useRef(false);
  const lastAddressRef = useRef<string | null>(null);

  // Extract address as a stable string — this changes only when the actual wallet changes,
  // not on every Privy object re-render.
  const solanaAddress = useMemo<string | null>(() => {
    if (!authenticated || !user) return null;
    // SAFETY: linkedAccounts is loosely typed by Privy; we only read type/chainType/address.
    const acc = user.linkedAccounts.find(
      (a: any) => a.type === "wallet" && a.chainType === "solana",
    ) as { address?: string } | undefined;
    return acc?.address ?? null;
  }, [authenticated, user]);

  // Clear the RPC cache when the wallet changes so stale per-wallet data doesn't leak.
  useEffect(() => {
    if (lastAddressRef.current && lastAddressRef.current !== solanaAddress) {
      clearCache();
    }
    lastAddressRef.current = solanaAddress;
  }, [solanaAddress]);

  const connectedWallet = useMemo<PrivyWalletLike | null>(() => {
    if (!solanaAddress) return null;
    const match = solanaWallets.find((w: PrivyWalletLike) => w.address === solanaAddress);
    return match ?? null;
  }, [solanaAddress, solanaWallets]);

  const retryCreateWallet = () => {
    setWalletError(null);
    creatingWalletRef.current = false;
  };

  // Auto-create Solana wallet once per session if the user is authenticated but has none.
  useEffect(() => {
    if (!authenticated || !user) return;
    if (solanaAddress) return;
    if (creatingWalletRef.current) return;
    creatingWalletRef.current = true;
    setWalletError(null);
    createSolanaWallet()
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Failed to create Solana wallet";
        console.error("Solana wallet creation error:", err);
        setWalletError(message);
        creatingWalletRef.current = false;
      });
  }, [authenticated, user, solanaAddress, createSolanaWallet]);

  const readOnlyProgram = useMemo(() => {
    const readOnlyProvider = new AnchorProvider(
      connection,
      new ReadOnlyWallet() as any,
      { commitment: "confirmed" },
    );
    return new Program<OxarProtocol>(idlJson as any, readOnlyProvider);
  }, [connection]);

  const { program, provider, walletAddress } = useMemo(() => {
    if (!solanaAddress) {
      return { program: readOnlyProgram, provider: null, walletAddress: null };
    }
    const pubkey = new PublicKey(solanaAddress);
    const adapter = connectedWallet
      ? new PrivySolanaAdapter(pubkey, connectedWallet, connection)
      : new ReadOnlyWallet(pubkey);

    const anchorProvider = new AnchorProvider(connection, adapter as any, {
      commitment: "confirmed",
    });
    const prog = new Program<OxarProtocol>(idlJson as any, anchorProvider);
    return { program: prog, provider: anchorProvider, walletAddress: pubkey };
  }, [solanaAddress, connectedWallet, connection, readOnlyProgram]);

  return (
    <SolanaContext.Provider
      value={{ connection, program, provider, walletAddress, walletError, retryCreateWallet }}
    >
      {children}
    </SolanaContext.Provider>
  );
}
