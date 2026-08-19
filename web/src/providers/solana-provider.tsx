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
import {
  useWallets as useSolanaWallets,
  useCreateWallet as useCreateSolanaWallet,
  useSignTransaction as useSolanaSignTransaction,
} from "@privy-io/react-auth/solana";
import { buildKoraLegacyTx, rebuildV0WithKora, SOL_SPONSORED_RESERVE } from "@oxar/sdk";
import { UserFacingError } from "@/lib/yield";
import { RPC_URL, WSS_URL, browserRpcEndpoint } from "@/lib/constants";
import { clearCache } from "@/lib/cache";
import { deriveSolanaWallets, hasExternalSolanaWallet } from "@/lib/wallet/solana-wallets";
import { koraEnabled, koraPayer, koraBlockhash, koraSignAndSend, reportGaslessFailure } from "@/lib/gas/kora";

/** Minimal wallet signer — what yield providers need to sign + send. */
export interface WalletSigner {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T>;
  /**
   * Sign SEVERAL transactions behind one prompt, returning the signed bytes.
   *
   * Optional: present when the connected wallet supports it. Raw bytes rather than
   * rebuilt objects because external wallets can't be round-tripped through
   * `Transaction.from` — the same reason `signAndSend` broadcasts their bytes
   * directly (see below).
   */
  signAllRaw?(txs: (Transaction | VersionedTransaction)[]): Promise<Uint8Array[]>;
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
  /** True when a real signer is connected (not the read-only fallback). Background
   *  flows (e.g. the pending-bridge deposit) must wait for this before signing. */
  canSign: boolean;
}

const SolanaContext = createContext<SolanaContextValue>({
  connection: new Connection(RPC_URL),
  wallet: null,
  walletAddress: null,
  walletError: null,
  retryCreateWallet: () => {},
  isExternal: false,
  canSign: false,
});

export function useSolanaContext() {
  return useContext(SolanaContext);
}

/**
 * The relayer REFUSED this transaction, as opposed to being unreachable.
 *
 * The difference is everything the user needs: a refusal is deterministic — the same
 * transaction will be refused every time — so "try again in a moment" is a lie that
 * costs them a minute per attempt. Seen in production: an unlisted memo program, and
 * a Token-2022 `transferCheckedWithFee` the validator can't read (that one is USDG,
 * whose transfer-fee extension is set to zero but still uses the instruction).
 */
function relayerRefused(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return (
    m.includes("invalid transaction") ||
    m.includes("not in the allowed list") ||
    m.includes("cannot validate")
  );
}

/** How Privy reports a wallet provider it can't reach — there is no error code, only
 *  this sentence, so match on it and keep the match narrow. */
function walletUnreachable(e: unknown): boolean {
  const m = (e instanceof Error ? e.message : String(e)).toLowerCase();
  return (
    m.includes("failed to connect to wallet") ||
    m.includes("wallet not connected") ||
    m.includes("no wallet connected")
  );
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

/** Sign a batch, given already-serialized unsigned transactions. Supplied by the
 *  provider, which is where Privy's hook can be called. */
export type BatchSign = (txBytes: Uint8Array[]) => Promise<Uint8Array[]>;

class PrivySolanaAdapter implements WalletSigner {
  private _publicKey: PublicKey;
  private _wallet: PrivyWalletLike;
  private _connection: Connection;
  private _isExternal: boolean;
  private _batchSign?: BatchSign;

  constructor(
    pubkey: PublicKey,
    wallet: PrivyWalletLike,
    connection: Connection,
    isExternal: boolean,
    batchSign?: BatchSign,
  ) {
    this._publicKey = pubkey;
    this._wallet = wallet;
    this._connection = connection;
    this._isExternal = isExternal;
    this._batchSign = batchSign;
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
        // …and where we can actually read it. Three different faults — node down,
        // relayer refused the transaction, wallet couldn't partial-sign — used to
        // reach the user as one sentence and reach us not at all.
        reportGaslessFailure(this._publicKey.toBase58(), "signAndSend", e);
        // A wallet we could not reach is not a relayer problem. Native gas asks the
        // same wallet for the same signature, so it fails identically — and meanwhile
        // the user is told free fees are down and to wait, when what they need is to
        // reconnect. Measured, not guessed: the first report this logging produced
        // was exactly this, on a swap with nothing else wrong with it.
        if (walletUnreachable(e)) {
          throw new UserFacingError(
            "We couldn't reach your wallet to sign. Reconnect it and try again — your money hasn't moved.",
          );
        }
        // Falling back only helps a wallet that can actually pay the fee. For one
        // holding no SOL — the whole point of gasless — native gas is a guaranteed
        // failure wearing the words "insufficient funds", which is both wrong and
        // unactionable. It bit hardest after a bridge: the money is already on
        // Solana, so the user is stranded holding USDC and told the wrong thing.
        // Say what actually happened instead, so the Retry that already exists means
        // something.
        const lamports = await this._connection.getBalance(this._publicKey).catch(() => 0);
        if (lamports < Number(SOL_SPONSORED_RESERVE)) {
          // A refusal will happen again on the next tap and the one after. Saying
          // "try again in a moment" to that is how a user spends ten minutes
          // re-tapping a button that cannot work.
          throw new UserFacingError(
            relayerRefused(e)
              ? "Free network fees don't cover this particular payment. Add a little SOL for the network fee, or pay with a different token — your money hasn't moved."
              : "Free network fees are briefly unavailable and your wallet has no SOL to " +
                "cover one. Your money is safe where it is — try again in a moment.",
          );
        }
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

  /** Unsigned wire bytes, with the two fields a legacy transaction may still be
   *  missing filled in. Shared by the one-at-a-time and the batch paths. */
  private async _toBytes(tx: Transaction | VersionedTransaction): Promise<Uint8Array> {
    if (tx instanceof Transaction) {
      if (!tx.recentBlockhash) {
        const { blockhash } = await this._connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;
      }
      if (!tx.feePayer) {
        tx.feePayer = this._publicKey;
      }
      return tx.serialize({ requireAllSignatures: false, verifySignatures: false });
    }
    return (tx as VersionedTransaction).serialize();
  }

  /** Present only when the provider handed us Privy's batch signer. */
  get signAllRaw(): ((txs: (Transaction | VersionedTransaction)[]) => Promise<Uint8Array[]>) | undefined {
    const batch = this._batchSign;
    if (!batch) return undefined;
    return async (txs) => {
      const bytes: Uint8Array[] = [];
      for (const tx of txs) bytes.push(await this._toBytes(tx));
      return batch(bytes);
    };
  }

  async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
    const txBytes: Uint8Array = await this._toBytes(tx);

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
  // The endpoint is resolved once, in the browser: `browserRpcEndpoint()` returns
  // our own proxy when NEXT_PUBLIC_RPC_PROXY is on, and Helius directly otherwise.
  // The socket always goes to Helius — a serverless function can't hold one open.
  const connection = useMemo(
    () => new Connection(browserRpcEndpoint(), { commitment: "confirmed", wsEndpoint: WSS_URL }),
    [],
  );
  const { authenticated, user } = usePrivy();
  const { wallets: solanaWallets } = useSolanaWallets();
  // Privy's batch overload: `signTransaction(...inputs)` returns one output per
  // input, behind a single prompt. This is what turns a five-asset basket from
  // five signatures into one.
  const { signTransaction: signSolanaTransaction } = useSolanaSignTransaction();
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
    // SAFETY: Privy types the batch input against its own connected-wallet type,
    // which `connectedWallet` is at runtime — it came out of `useSolanaWallets()`.
    // The local `PrivyWalletLike` shape is ours, deliberately narrower.
    const batchSign: BatchSign | undefined = connectedWallet
      ? async (txBytes) => {
          const inputs = txBytes.map((transaction) => ({
            transaction,
            wallet: connectedWallet as never,
            chain: "solana:mainnet" as const,
          }));
          const out = await signSolanaTransaction(...(inputs as [never, ...never[]]));
          const list = Array.isArray(out) ? out : [out];
          return list.map((r) => r.signedTransaction);
        }
      : undefined;
    const signer: WalletSigner = connectedWallet
      ? new PrivySolanaAdapter(pubkey, connectedWallet, connection, isExternalActive, batchSign)
      : new ReadOnlyWallet(pubkey);
    return { wallet: signer, walletAddress: pubkey };
  }, [solanaAddress, connectedWallet, connection, isExternalActive, signSolanaTransaction]);

  return (
    <SolanaContext.Provider
      value={{ connection, wallet, walletAddress, walletError, retryCreateWallet, isExternal: isExternalActive, canSign: !!connectedWallet }}
    >
      {children}
    </SolanaContext.Provider>
  );
}
