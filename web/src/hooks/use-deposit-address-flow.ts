"use client";

import { useCallback, useState } from "react";
import { useDepositAddress } from "@privy-io/react-auth";

import { useSolanaContext } from "@/providers/solana-provider";
import { USDC_MINT } from "@/lib/constants";

/** CAIP-2 chain id for Solana mainnet — the same one the on-ramp expects. */
const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

/**
 * Money arriving from a chain we have no account on.
 *
 * Privy hands out an address (routing and bridging by Relay), the person sends
 * whatever they hold wherever they hold it, and USDC lands in this wallet. It
 * covers the case the bridge never could: funds sitting on an exchange, which
 * cannot be "connected" as a wallet — you can only withdraw from it to an address.
 *
 * Delora stays for the other half — paying from a wallet you hold, inside a
 * purchase. Neither replaces the other.
 *
 * The destination is always OUR Solana USDC, so whatever route the person takes,
 * what arrives is the one asset every product here is bought with.
 *
 * NOTE: `useDepositAddress` is marked experimental in the SDK and opens Privy's
 * own modal for choosing the source. If they change it, this hook is the only
 * place that has to move.
 */
export function useDepositAddressFlow() {
  const { walletAddress } = useSolanaContext();
  const { createDepositAddress } = useDepositAddress();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const open = useCallback(async () => {
    if (!walletAddress) return;
    setError(null);
    setBusy(true);
    try {
      await createDepositAddress({
        destinationChain: SOLANA_MAINNET_CAIP2,
        destinationCurrency: USDC_MINT,
        destinationAddress: walletAddress.toBase58(),
      });
    } catch (e) {
      // The person closing the modal reads as an error here; nothing to report.
      const code = (e as { code?: string } | null)?.code;
      if (code && code !== "USER_EXITED") setError(code);
    } finally {
      setBusy(false);
    }
  }, [createDepositAddress, walletAddress]);

  return { open, busy, error };
}
