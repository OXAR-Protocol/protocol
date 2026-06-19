"use client";

import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";

import { useSolanaContext } from "@/providers/solana-provider";
import { getProvider, toFriendlyError, UserFacingError } from "@/lib/yield";
import { spendableBase, usdToBase, type WalletAsset } from "@/lib/portfolio/assets";
import {
  buildQuoteRequest,
  bridgeFeeTooHigh,
  bridgeNetOut,
  networkToChainId,
  type BridgeQuote,
} from "@/lib/bridge/delora";
import { savePending } from "@/lib/bridge/pending";
import { readUsdcBase } from "@/lib/bridge/arrival";
import { isNativeEvm, encodeApprove, readAllowance } from "@/lib/evm/erc20";
import { publicClientFor } from "@/lib/evm/chains";

export type BridgeStatus = "idle" | "quoting" | "approving" | "bridging" | "arriving" | "depositing";

/** Min SOL the receiver needs for the post-bridge deposit (tx fee + jlToken ATA rent). */
const MIN_RECEIVER_LAMPORTS = 5_000_000; // ~0.005 SOL

// SAFETY: Privy ConnectedWallet shape is loosely typed across versions; we use a
// minimal structural interface for the EVM send path.
interface EvmWallet {
  address: string;
  walletClientType?: string;
  switchChain(chainId: number): Promise<void>;
  getEthereumProvider(): Promise<{ request(args: { method: string; params?: unknown[] }): Promise<unknown> }>;
}

/**
 * Cross-chain deposit: bridge an EVM asset → USDC on Solana (Delora) → deposit.
 * Delora has no status endpoint, so we persist a pending record and poll the
 * Solana side for arrival (survives reloads — see use-pending-bridge).
 */
export function useBridgeDeposit(providerId: string) {
  const { connection, walletAddress } = useSolanaContext();
  const { wallets } = useWallets();
  const [status, setStatus] = useState<BridgeStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(
    async (req: ReturnType<typeof buildQuoteRequest>): Promise<BridgeQuote> => {
      const res = await fetch("/api/bridge-quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "No bridge route found");
      return json as BridgeQuote;
    },
    [],
  );

  const bridgeAndDeposit = useCallback(
    async (payAsset: WalletAsset, usdAmount: number): Promise<bigint> => {
      const provider = getProvider(providerId);
      if (!walletAddress || !provider) throw new Error("Wallet not connected");
      if (usdAmount <= 0) return BigInt(0);

      // Bridge to the SELECTED market's asset (USDC / USDG / USDT), not hardcoded USDC.
      const destinationMint = provider.asset.toBase58();

      const originChainId = payAsset.network ? networkToChainId(payAsset.network) : null;
      if (!originChainId) throw new UserFacingError("This chain isn't supported yet");

      const evmWallet = (wallets as unknown as EvmWallet[]).find(
        (w) => w.walletClientType && w.walletClientType !== "privy",
      ) ?? (wallets as unknown as EvmWallet[])[0];
      if (!evmWallet) throw new UserFacingError("Connect an EVM wallet (MetaMask) to pay from another chain");

      setError(null);
      try {
        // The post-bridge deposit is a Solana tx — the RECEIVING wallet must hold a
        // little SOL for its fee + the lending-token account rent, or the deposit
        // can't land and the bridged USDC gets stranded. Block BEFORE moving money.
        const receiverSol = await connection.getBalance(walletAddress);
        if (receiverSol < MIN_RECEIVER_LAMPORTS) {
          const have = (receiverSol / 1e9).toFixed(4);
          const need = (MIN_RECEIVER_LAMPORTS / 1e9).toFixed(3);
          throw new UserFacingError(
            `Your Solana wallet needs a little SOL to finish the deposit after bridging — ` +
              `you have ${have} SOL but need at least ${need}. Add a bit of SOL and try again.`,
          );
        }

        // USD → pay-asset base units (cap by balance; reserve handled by spendableBase).
        let payBase = usdToBase(payAsset, usdAmount);
        const max = spendableBase(payAsset);
        if (payBase > max) payBase = max;
        if (payBase <= BigInt(0)) throw new UserFacingError(`Not enough ${payAsset.symbol}`);

        setStatus("quoting");
        const req = buildQuoteRequest({
          senderAddress: evmWallet.address,
          originChainId,
          amount: payBase,
          originCurrency: payAsset.mint,
          receiverAddress: walletAddress.toBase58(),
          destinationMint,
        });
        const quote = await fetchQuote(req);
        if (bridgeFeeTooHigh(quote, usdAmount)) {
          throw new UserFacingError(
            `Fees are too high for $${usdAmount.toFixed(2)} on this network. ` +
              "Try a larger amount, or a cheaper chain like Base or Arbitrum.",
          );
        }

        const provider1193 = await evmWallet.getEthereumProvider();
        await evmWallet.switchChain(originChainId);
        // Read/receipt via the wallet's own RPC (the default public RPC is flaky).
        const client = publicClientFor(originChainId, provider1193);

        // ERC-20 needs an allowance to the Delora diamond before bridging.
        if (!isNativeEvm(payAsset.mint) && quote.approvalAddress) {
          const spender = quote.approvalAddress;
          const allowance = await readAllowance({
            chainId: originChainId,
            token: payAsset.mint,
            owner: evmWallet.address,
            spender,
            provider: provider1193,
          });
          if (allowance < payBase) {
            setStatus("approving");
            const approve = async (amount: bigint) => {
              const hash = (await provider1193.request({
                method: "eth_sendTransaction",
                params: [{ from: evmWallet.address, to: payAsset.mint, data: encodeApprove(spender, amount) }],
              })) as `0x${string}`;
              await client.waitForTransactionReceipt({ hash });
            };
            // USDT (and some tokens) REVERT on approve() when the current allowance
            // is already non-zero — they require resetting it to 0 first. So when a
            // stale/partial allowance is in the way, reset to 0, then set the amount.
            if (allowance > BigInt(0)) await approve(BigInt(0));
            await approve(payBase);
          }
        }

        // Baseline destination-token balance so we can detect the bridged funds landing.
        const baseline = await readUsdcBase(connection, walletAddress, destinationMint);
        const expected = bridgeNetOut(quote);

        setStatus("bridging");
        // EIP-1193 wants a hex value; normalize whether Delora returns hex ("0x00") or decimal.
        const valueHex = `0x${BigInt(quote.calldata.value || "0").toString(16)}`;
        const txHash = (await provider1193.request({
          method: "eth_sendTransaction",
          params: [{ from: evmWallet.address, to: quote.calldata.to, value: valueHex, data: quote.calldata.data }],
        })) as string;

        savePending({
          providerId,
          originChainId,
          originTxHash: txHash,
          mint: destinationMint,
          expectedUsdc: expected.toString(),
          baselineUsdc: baseline.toString(),
          receiver: walletAddress.toBase58(),
          bridgeScan: quote.bridgeScan,
          createdAt: Date.now(),
        });

        // Don't trap the UI waiting for the (sometimes multi-minute) bridge: the
        // user is done once the origin tx is submitted. The global pending-bridge
        // watcher polls for arrival and finishes the deposit in the background.
        return expected;
      } catch (e) {
        console.error("Bridge deposit failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [providerId, walletAddress, wallets, connection, fetchQuote],
  );

  return { bridgeAndDeposit, status, error };
}
