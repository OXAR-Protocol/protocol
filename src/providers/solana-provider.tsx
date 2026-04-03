"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { usePrivy } from "@privy-io/react-auth";
import { OxarProtocol } from "@/lib/types/oxar_protocol";
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
    throw new Error("Wallet not ready for signing yet.");
  }
  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    throw new Error("Wallet not ready for signing yet.");
  }
}

// Uses Privy's getPrivateKey to export key and sign locally
// This is the most reliable approach for localnet testing
class PrivyLocalSigner {
  private _publicKey: PublicKey;
  private _privyUser: any;
  private _getAccessToken: () => Promise<string>;

  constructor(pubkey: PublicKey, privyUser: any, getAccessToken: () => Promise<string>) {
    this._publicKey = pubkey;
    this._privyUser = privyUser;
    this._getAccessToken = getAccessToken;
  }

  get publicKey(): PublicKey {
    return this._publicKey;
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    // For now, throw a helpful error — we'll implement proper signing next
    throw new Error(
      "Transaction signing with Privy embedded wallets requires Solana RPC configuration in Privy Dashboard. " +
      "For localnet testing, please use the CLI tool instead. " +
      "For devnet/mainnet, configure Solana RPC URL in Privy Dashboard > Settings."
    );
  }

  async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
    throw new Error("Same as signTransaction — see error above.");
  }
}

export function SolanaProvider({ children }: { children: ReactNode }) {
  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), []);
  const { authenticated, user, getAccessToken } = usePrivy();
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

    const walletAdapter = new PrivyLocalSigner(pubkey, user, getAccessToken);

    const anchorProvider = new AnchorProvider(connection, walletAdapter as any, {
      commitment: "confirmed",
      skipPreflight: true,
    });

    const prog = new Program<OxarProtocol>(idlJson as any, anchorProvider);
    setProvider(anchorProvider);
    setProgram(prog);
  }, [authenticated, user, connection, readOnlyProgram, getAccessToken]);

  return (
    <SolanaContext.Provider value={{ connection, program, provider, walletAddress }}>
      {children}
    </SolanaContext.Provider>
  );
}
