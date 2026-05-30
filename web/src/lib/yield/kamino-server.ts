import "server-only";

import BN from "bn.js";
// IMPORTANT: import kit from klend's version (2.3.0, aliased as `klend-kit`), NOT the
// top-level @solana/kit@6.x that Privy uses — klend's functions/signers are typed
// against 2.x and the two majors' TransactionSigner shapes are incompatible.
import {
  address,
  createSolanaRpc,
  pipe,
  createTransactionMessage,
  appendTransactionMessageInstructions,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  type Address,
  type Instruction,
  type TransactionSigner,
} from "klend-kit";
import {
  KaminoMarket,
  KaminoAction,
  VanillaObligation,
  PROGRAM_ID,
  U64_MAX,
  getMedianSlotDurationInMsFromLastEpochs,
} from "@kamino-finance/klend-sdk";

import { RPC_URL, USDC_MINT } from "@/lib/constants";

// Kamino Lend mainnet "Main" market. USDC reserve is resolved from the mint.
const MAIN_MARKET = address("7u3HeHxYDLhnCoErrtycNokbQYbWGzLs6JSDqGAv5PfF");
const USDC = address(USDC_MINT);

type Rpc = ReturnType<typeof createSolanaRpc>;

function getRpc(): Rpc {
  // Server-side RPC URL (the public Helius var is also available to the server).
  return createSolanaRpc(process.env.NEXT_PUBLIC_SOLANA_RPC_URL || RPC_URL);
}

// Cache the heavy market load briefly (per warm serverless instance).
let marketCache: { market: KaminoMarket; ts: number } | null = null;
async function loadMarket(rpc: Rpc): Promise<KaminoMarket> {
  if (marketCache && Date.now() - marketCache.ts < 60_000) return marketCache.market;
  const slotDuration = await getMedianSlotDurationInMsFromLastEpochs();
  // SAFETY: kit's generic `Rpc<SolanaRpcApi>` is a structural superset of the
  // `Rpc<KaminoMarketRpcApi>` that load() wants — same transport at runtime.
  const market = await KaminoMarket.load(
    rpc as unknown as Parameters<typeof KaminoMarket.load>[0],
    MAIN_MARKET,
    slotDuration,
  );
  if (!market) throw new Error("Kamino market unavailable");
  marketCache = { market, ts: Date.now() };
  return market;
}

/** Build-only signer — produces no signatures; Privy signs client-side. */
function noopSigner(owner: Address): TransactionSigner {
  return { address: owner, async signTransactions() { return []; } } as TransactionSigner;
}

function collectIxs(action: KaminoAction): Instruction[] {
  return [
    ...action.computeBudgetIxs,
    ...action.setupIxs,
    ...action.inBetweenIxs,
    ...action.lendingIxs,
    ...action.cleanupIxs,
  ];
}

/** Assemble klend kit-instructions into an UNSIGNED base64 v0 wire transaction. */
async function buildUnsignedTx(
  rpc: Rpc,
  owner: TransactionSigner,
  ixs: Instruction[],
): Promise<string> {
  const { value: blockhash } = await rpc.getLatestBlockhash().send();
  const signed = await pipe(
    createTransactionMessage({ version: 0 }),
    (m) => appendTransactionMessageInstructions(ixs, m),
    (m) => setTransactionMessageFeePayerSigner(owner, m),
    (m) => setTransactionMessageLifetimeUsingBlockhash(blockhash, m),
    (m) => signTransactionMessageWithSigners(m),
  );
  return getBase64EncodedWireTransaction(signed);
}

function usdcReserveAddress(market: KaminoMarket): Address {
  const [reserve] = market.getReservesByMint(USDC);
  if (!reserve) throw new Error("Kamino USDC reserve unavailable");
  return reserve.address;
}

export async function buildKaminoDepositTx(ownerBase58: string, amount: bigint): Promise<string> {
  const rpc = getRpc();
  const market = await loadMarket(rpc);
  const owner = noopSigner(address(ownerBase58));
  const currentSlot = await rpc.getSlot().send();
  const action = await KaminoAction.buildDepositTxns({
    kaminoMarket: market,
    amount: new BN(amount.toString()),
    reserveAddress: usdcReserveAddress(market),
    owner,
    obligation: new VanillaObligation(PROGRAM_ID),
    useV2Ixs: false,
    scopeRefreshConfig: undefined,
    extraComputeBudget: 300_000,
    includeAtaIxs: true,
    currentSlot,
  });
  return buildUnsignedTx(rpc, owner, collectIxs(action));
}

export async function buildKaminoWithdrawTx(
  ownerBase58: string,
  amount: bigint,
  max: boolean,
): Promise<string> {
  const rpc = getRpc();
  const market = await loadMarket(rpc);
  const owner = noopSigner(address(ownerBase58));
  const currentSlot = await rpc.getSlot().send();
  const action = await KaminoAction.buildWithdrawTxns({
    kaminoMarket: market,
    amount: max ? U64_MAX : new BN(amount.toString()),
    reserveAddress: usdcReserveAddress(market),
    owner,
    obligation: new VanillaObligation(PROGRAM_ID),
    useV2Ixs: false,
    scopeRefreshConfig: undefined,
    extraComputeBudget: 300_000,
    includeAtaIxs: true,
    currentSlot,
  });
  return buildUnsignedTx(rpc, owner, collectIxs(action));
}

export async function getKaminoApy(): Promise<number> {
  const rpc = getRpc();
  const market = await loadMarket(rpc);
  const [reserve] = market.getReservesByMint(USDC);
  if (!reserve) return 0;
  const slot = await rpc.getSlot().send();
  return reserve.totalSupplyAPY(slot); // already a fraction (0.05 = 5%)
}

export async function getKaminoPosition(
  ownerBase58: string,
): Promise<{ underlyingBalance: string; shares: string }> {
  const rpc = getRpc();
  const market = await loadMarket(rpc);
  const [reserve] = market.getReservesByMint(USDC);
  if (!reserve) return { underlyingBalance: "0", shares: "0" };

  const obligation = await market.getObligationByWallet(
    address(ownerBase58),
    new VanillaObligation(PROGRAM_ID),
  );
  const pos = obligation?.getDepositByReserve(reserve.address);
  // `amount` is the supplied USDC in base units (incl. accrued interest).
  const underlyingBalance = pos ? BigInt(pos.amount.floor().toString()).toString() : "0";
  // Kamino full exits use a max-withdraw sentinel (U64_MAX), not a share count, so
  // we don't need the cToken balance — `shares` is unused for this provider.
  return { underlyingBalance, shares: "0" };
}
