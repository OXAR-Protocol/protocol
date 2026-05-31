"use client";

import { useCallback, useState } from "react";
import { useWallets } from "@privy-io/react-auth";

import { useSolanaContext } from "@/providers/solana-provider";
import { useYieldActions } from "@/hooks/use-yield-actions";
import { getProvider, toBaseUnits, toFriendlyError, UserFacingError } from "@/lib/yield";
import { USDC_MINT } from "@/lib/constants";
import { spendableBase, type WalletAsset } from "@/lib/portfolio/assets";
import {
  buildQuoteRequest,
  bridgeFeeTooHigh,
  bridgeNetOut,
  networkToChainId,
  type BridgeQuote,
} from "@/lib/bridge/delora";
import { savePending, clearPending, loadPending } from "@/lib/bridge/pending";
import { readUsdcBase, pollUsdcArrival } from "@/lib/bridge/arrival";
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
  const { deposit } = useYieldActions(providerId);
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
          throw new UserFacingError(
            "Your Solana wallet needs a little SOL (~0.01) to finish the deposit after bridging. " +
              "Add some SOL to it and try again.",
          );
        }

        // USD → pay-asset base units (cap by balance; reserve handled by spendableBase).
        const price = payAsset.usdValue / payAsset.uiAmount;
        const payUi = usdAmount / price;
        let payBase = toBaseUnits(payUi.toFixed(payAsset.decimals), payAsset.decimals);
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
          usdcMint: USDC_MINT,
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
        const client = publicClientFor(originChainId);

        // ERC-20 needs an allowance to the Delora diamond before bridging.
        if (!isNativeEvm(payAsset.mint) && quote.approvalAddress) {
          const allowance = await readAllowance({
            chainId: originChainId,
            token: payAsset.mint,
            owner: evmWallet.address,
            spender: quote.approvalAddress,
          });
          if (allowance < payBase) {
            setStatus("approving");
            const approveHash = (await provider1193.request({
              method: "eth_sendTransaction",
              params: [{ from: evmWallet.address, to: payAsset.mint, data: encodeApprove(quote.approvalAddress, payBase) }],
            })) as `0x${string}`;
            await client.waitForTransactionReceipt({ hash: approveHash });
          }
        }

        // Baseline Solana USDC so we can detect the bridged funds landing.
        const baseline = await readUsdcBase(connection, walletAddress, USDC_MINT);
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
          expectedUsdc: expected.toString(),
          baselineUsdc: baseline.toString(),
          receiver: walletAddress.toBase58(),
          bridgeScan: quote.bridgeScan,
          createdAt: Date.now(),
        });

        setStatus("arriving");
        const arrived = await pollUsdcArrival({ connection, owner: walletAddress, mint: USDC_MINT, baseline, expected });
        if (!arrived) {
          // Pending record is kept → recovery (use-pending-bridge) finishes the deposit later.
          throw new UserFacingError("Funds are taking longer than usual to arrive — they'll auto-deposit once they land.");
        }

        // Claim the deposit by clearing pending BEFORE depositing, so a concurrent
        // recovery flow (e.g. after a reload) sees null and can't double-deposit.
        if (!loadPending()) return expected; // another flow already claimed + deposited
        clearPending();
        setStatus("depositing");
        try {
          await deposit(expected);
        } catch (depositErr) {
          console.error("Deposit after bridge failed:", depositErr);
          throw new UserFacingError(
            "Funds arrived on Solana but the deposit failed — your USDC is in your wallet. " +
              "You can deposit it directly (select USDC).",
          );
        }
        return expected;
      } catch (e) {
        console.error("Bridge deposit failed:", e);
        setError(toFriendlyError(e));
        throw e;
      } finally {
        setStatus("idle");
      }
    },
    [providerId, walletAddress, wallets, connection, deposit, fetchQuote],
  );

  return { bridgeAndDeposit, status, error };
}
