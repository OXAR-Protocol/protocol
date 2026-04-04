"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets as useSolanaWallets } from "@privy-io/react-auth/solana";
import type { OxarProtocol } from "@oxar/sdk";
import idlJson from "@/lib/idl/oxar_protocol.json";
import { RPC_URL } from "@/lib/constants";

interface SolanaContextValue {
  connection: Connection;
  program: Program<OxarProtocol> | null;
  provider: AnchorProvider | null;
  walletAddress: PublicKey | null;
}

const SolanaContext = createContext<SolanaContextValue>({
  connection: new Connection(RPC_URL),
  program: null,
  provider: null,
  walletAddress: null,
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
  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    throw new Error("Please connect your wallet to sign transactions.");
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    throw new Error("Please connect your wallet to sign transactions.");
  }
}

class PrivySolanaAdapter {
  private _publicKey: PublicKey;
  private _wallet: any;
  private _connection: Connection;

  constructor(pubkey: PublicKey, wallet: any, connection: Connection) {
    this._publicKey = pubkey;
    this._wallet = wallet;
    this._connection = connection;
  }

  get publicKey(): PublicKey {
    return this._publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    // Privy expects { transaction: Uint8Array, chain?: string }
    let txBytes: Uint8Array;

    if (tx instanceof Transaction) {
      // Ensure blockhash and feePayer are set
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

    // Deserialize the signed transaction
    if (tx instanceof Transaction) {
      return Transaction.from(result.signedTransaction) as T;
    }
    return VersionedTransaction.deserialize(result.signedTransaction) as T;
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    const signed = [];
    for (const tx of txs) {
      signed.push(await this.signTransaction(tx));
    }
    return signed;
  }
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), []);
  const { authenticated, user } = usePrivy();
  const { wallets: solanaWallets, ready: solanaReady } = useSolanaWallets();
  const [program, setProgram] = useState<Program<OxarProtocol> | null>(null);
  const [provider, setProvider] = useState<AnchorProvider | null>(null);
  const [walletAddress, setWalletAddress] = useState<PublicKey | null>(null);

  const readOnlyProgram = useMemo(() => {
    const readOnlyProvider = new AnchorProvider(
      connection,
      new ReadOnlyWallet() as any,
      { commitment: "confirmed" }
    );
    return new Program<OxarProtocol>(idlJson as any, readOnlyProvider);
  }, [connection]);

  useEffect(() => {
    if (!authenticated || !user) {
      setProgram(readOnlyProgram);
      setProvider(null);
      setWalletAddress(null);
      return;
    }

    const solanaAccount = user.linkedAccounts.find(
      (a: any) => a.type === "wallet" && a.chainType === "solana"
    ) as any;

    if (!solanaAccount) {
      setProgram(readOnlyProgram);
      setProvider(null);
      setWalletAddress(null);
      return;
    }

    const pubkey = new PublicKey(solanaAccount.address);
    setWalletAddress(pubkey);

    const connectedSolana = solanaWallets.find(
      (w: any) => w.address === solanaAccount.address
    );

    let walletAdapter: any;
    if (connectedSolana) {
      console.log("Privy Solana wallet ready for signing:", pubkey.toBase58());
      walletAdapter = new PrivySolanaAdapter(pubkey, connectedSolana, connection);
    } else {
      console.log("Solana wallet found, waiting for connector:", pubkey.toBase58());
      walletAdapter = new ReadOnlyWallet(pubkey);
    }

    const anchorProvider = new AnchorProvider(connection, walletAdapter as any, {
      commitment: "confirmed",
    });

    const prog = new Program<OxarProtocol>(idlJson as any, anchorProvider);
    setProvider(anchorProvider);
    setProgram(prog);
  }, [authenticated, user, solanaWallets, solanaReady, connection, readOnlyProgram]);

  return (
    <SolanaContext.Provider value={{ connection, program, provider, walletAddress }}>
      {children}
    </SolanaContext.Provider>
  );
}
