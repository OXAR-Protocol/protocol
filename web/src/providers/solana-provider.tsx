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
import { Connection, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets as useSolanaWallets, useCreateWallet as useCreateSolanaWallet } from "@privy-io/react-auth/solana";
import { RPC_URL } from "@/lib/constants";
import { clearCache } from "@/lib/cache";
import { deriveSolanaWallets, hasExternalSolanaWallet } from "@/lib/wallet/solana-wallets";
import { koraEnabled, koraPayer, koraBlockhash, koraSignAndSend } from "@/lib/gas/kora";
import { buildKoraLegacyTx, rebuildV0WithKora } from "@/lib/gas/kora-tx";

/** Minimal wallet signer — what yield providers need to sign + send. */
export interface WalletSigner {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  /**
   * Sign AND broadcast a transaction; returns the signature. External (mobile)
   * wallets can't round-trip a signed tx back through our deserialize (it fails
   * "Reached end of buffer"), so they sign-and-send via the wallet instead.
   *
   * `opts.sponsor` (embedded wallets only): let Privy broadcast + pay the fee
   * (dashboard "App pays"), so a wallet with no SOL can still transact.
   */
  signAndSend(tx: Transaction | VersionedTransaction, opts?: { sponsor?: boolean }): Promise<string>;
}

interface SolanaContextValue {
  connection: Connection;
  /** Connected wallet signer, or null when not authenticated. */
  wallet: WalletSigner | null;
  walletAddress: PublicKey | null;
  walletError: string | null;
  retryCreateWallet: () => void;
  /** True when the active wallet is an external one (Phantom/Trust) vs the embedded
   * one — external wallets need legacy (not v0) swap txs. */
  isExternal: boolean;
}

const SolanaContext = createContext<SolanaContextValue>({
  connection: new Connection(RPC_URL),
  wallet: null,
  walletAddress: null,
  walletError: null,
  retryCreateWallet: () => {},
  isExternal: false,
});

export function useSolanaContext() {
  return useContext(SolanaContext);
}

class ReadOnlyWallet implements WalletSigner {
  constructor(public readonly publicKey: PublicKey) {}
  async signTransaction<T extends Transaction | VersionedTransaction>(_tx: T): Promise<T> {
    throw new Error("Please connect your wallet to sign transactions.");
  }
  async signAndSend(_tx: Transaction | VersionedTransaction, _opts?: { sponsor?: boolean }): Promise<string> {
    throw new Error("Please connect your wallet to sign transactions.");
  }
}

// SAFETY: Privy wallet shape is opaque across versions — interface is stable for this
// method. `chain` is Privy's CAIP-2 SolanaChain (`solana:mainnet`), a template literal.
type SolanaChainId = `${string}:${string}`;
interface PrivyWalletLike {
  signTransaction(args: { transaction: Uint8Array; chain?: SolanaChainId }): Promise<{ signedTransaction: Uint8Array }>;
  /** Privy signs + broadcasts; `sponsor` makes Privy pay the fee (App-pays). */
  signAndSendTransaction(args: {
    transaction: Uint8Array;
    address?: string;
    chain?: SolanaChainId;
    sponsor?: boolean;
  }): Promise<{ signature: Uint8Array }>;
  address: string;
}

class PrivySolanaAdapter implements WalletSigner {
  private _publicKey: PublicKey;
  private _wallet: PrivyWalletLike;
  private _connection: Connection;
  private _isExternal: boolean;

  constructor(pubkey: PublicKey, wallet: PrivyWalletLike, connection: Connection, isExternal: boolean) {
    this._publicKey = pubkey;
    this._wallet = wallet;
    this._connection = connection;
    this._isExternal = isExternal;
  }

  get publicKey(): PublicKey {
    return this._publicKey;
  }

  /**
   * Sign and broadcast; returns the signature.
   *
   * External wallets (Phantom/Solflare/Trust, often mobile via WalletConnect)
   * support `signTransaction` but NOT `signAndSendTransaction` (Trust returns
   * JSON-RPC -32601 "Method not found"). Re-deserializing their signed bytes also
   * throws "Reached end of buffer". So for them we call `signTransaction` and
   * broadcast the returned signed bytes DIRECTLY — no deserialize round-trip.
   *
   * The embedded wallet keeps the sign-then-we-broadcast path (auto-send is flaky
   * for embedded — see web/CLAUDE.md). Both wallet types pay their own SOL gas; the
   * card buy funds native SOL so the wallet always has enough.
   */
  async signAndSend(tx: Transaction | VersionedTransaction, _opts?: { sponsor?: boolean }): Promise<string> {
    // Gasless first, for EVERY wallet (embedded + external): Kora co-signs as fee payer and
    // pays the gas, so a wallet with $0 SOL can transact whatever it paid with. Covers both
    // our legacy txs (Jupiter Lend) and v0 txs (Kamino, Jupiter swaps for stocks/gold).
    // Any failure — node down, a program off the allowlist, a wallet that can't partial-sign —
    // falls through to native SOL gas, so the money path degrades gracefully.
    if (koraEnabled()) {
      try {
        return await this._signAndSendViaKora(tx);
      } catch (e) {
        console.warn("Kora gasless path failed; falling back to native SOL gas:", e);
      }
    }
    return this._signAndSendNative(tx);
  }

  /**
   * Gasless send: Kora is the fee payer. Rebuild the tx with Kora's pubkey + a node blockhash
   * (legacy → copy instructions; v0 → decompile with its lookup tables and recompile), have
   * the wallet partial-sign (its authority sig only), then hand it to Kora to add the
   * fee-payer signature and broadcast. The user needs no SOL.
   */
  private async _signAndSendViaKora(tx: Transaction | VersionedTransaction): Promise<string> {
    const [payer, blockhash] = await Promise.all([koraPayer(), koraBlockhash()]);
    const koraPk = new PublicKey(payer);

    // Never mutate the caller's tx — a failed Kora attempt must leave a clean tx for the
    // native fallback (and its own signing prompt).
    const koraTx =
      tx instanceof Transaction
        ? buildKoraLegacyTx(tx, this._publicKey, koraPk, blockhash)
        : await rebuildV0WithKora(tx, this._publicKey, koraPk, blockhash, this._connection);

    const unsigned =
      koraTx instanceof Transaction
        ? koraTx.serialize({ requireAllSignatures: false, verifySignatures: false })
        : koraTx.serialize();
    const { signedTransaction } = await this._wallet.signTransaction({
      transaction: unsigned,
      chain: "solana:mainnet",
    });
    const st = signedTransaction as Uint8Array | string;
    const signedBytes =
      typeof st === "string" ? Uint8Array.from(atob(st), (c) => c.charCodeAt(0)) : st;
    return koraSignAndSend(signedBytes);
  }

  /** Native path — wallet pays its own SOL gas. Unchanged behavior, used as the Kora fallback. */
  private async _signAndSendNative(tx: Transaction | VersionedTransaction): Promise<string> {
    if (tx instanceof Transaction) {
      if (!tx.recentBlockhash) {
        tx.recentBlockhash = (await this._connection.getLatestBlockhash()).blockhash;
      }
      if (!tx.feePayer) tx.feePayer = this._publicKey;
    }

    if (this._isExternal) {
      const txBytes =
        tx instanceof Transaction
          ? tx.serialize({ requireAllSignatures: false, verifySignatures: false })
          : tx.serialize();
      const { signedTransaction } = await this._wallet.signTransaction({
        transaction: txBytes,
        chain: "solana:mainnet",
      });
      // Some external wallets return the signed tx base64-encoded; normalize to bytes.
      const st = signedTransaction as Uint8Array | string;
      const rawSigned =
        typeof st === "string" ? Uint8Array.from(atob(st), (c) => c.charCodeAt(0)) : st;
      return this._connection.sendRawTransaction(rawSigned);
    }

    const signed = await this.signTransaction(tx);
    return this._connection.sendRawTransaction(signed.serialize());
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
      // v1 (SDK-frontend) targets mainnet — Jupiter Lend / Kamino only exist there.
      chain: "solana:mainnet",
    });

    if (tx instanceof Transaction) {
      return Transaction.from(result.signedTransaction) as T;
    }
    return VersionedTransaction.deserialize(result.signedTransaction) as T;
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

  // v2: the account = the wallet you logged in with. For an email user that's the
  // embedded wallet; for a wallet-login user it's their own Solana wallet (no
  // embedded is created). One wallet everywhere (balances, positions, bridge
  // receiver). See docs/plans/2026-06-01-wallet-payment-architecture-v2.md.
  const solanaAddress = useMemo<string | null>(() => {
    if (!authenticated || !user) return null;
    return deriveSolanaWallets(user.linkedAccounts as any[], null).active;
  }, [authenticated, user]);

  // Is the active account an external wallet (Phantom/Solflare/Trust) vs the
  // embedded one? Drives the signing strategy (external → signAndSend).
  const isExternalActive = useMemo<boolean>(() => {
    if (!authenticated || !user || !solanaAddress) return false;
    const { options } = deriveSolanaWallets(user.linkedAccounts as any[], null);
    return options.find((o) => o.address === solanaAddress)?.isExternal ?? false;
  }, [authenticated, user, solanaAddress]);

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

  // Auto-create an embedded Solana wallet once per session for users who have no
  // wallet of their own (email/social login). NEVER for a wallet-login user — they
  // operate from their own wallet, so a second empty embedded one would re-create
  // the very confusion v2 removes.
  useEffect(() => {
    if (!authenticated || !user) return;
    if (solanaAddress) return;
    if (hasExternalSolanaWallet(user.linkedAccounts as any[])) return;
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

  const { wallet, walletAddress } = useMemo(() => {
    if (!solanaAddress) {
      return { wallet: null, walletAddress: null };
    }
    const pubkey = new PublicKey(solanaAddress);
    const signer: WalletSigner = connectedWallet
      ? new PrivySolanaAdapter(pubkey, connectedWallet, connection, isExternalActive)
      : new ReadOnlyWallet(pubkey);
    return { wallet: signer, walletAddress: pubkey };
  }, [solanaAddress, connectedWallet, connection, isExternalActive]);

  return (
    <SolanaContext.Provider
      value={{ connection, wallet, walletAddress, walletError, retryCreateWallet, isExternal: isExternalActive }}
    >
      {children}
    </SolanaContext.Provider>
  );
}
