"use client";

import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

import { BottomSheet } from "@/components/bottom-sheet";
import { ListingAccount } from "@/hooks/use-listings";
import { findVaultConfig, formatTokens, formatUsdc, shortenAddress } from "@/lib/format";

interface BuySheetProps {
  listing: ListingAccount | null;
  open: boolean;
  onClose: () => void;
  onBuy: (vaultPubkey: PublicKey, sellerPubkey: PublicKey) => Promise<void>;
  buying: boolean;
}

export function BuySheet({ listing, open, onClose, onBuy, buying }: BuySheetProps) {
  if (!listing) return null;

  const vaultConfig = findVaultConfig(listing.account.vault.toBase58());
  const vaultName = vaultConfig?.label || "Unknown Vault";
  const sellerAddr = shortenAddress(listing.account.seller.toBase58());

  const total = listing.account.amount
    .mul(listing.account.pricePerToken)
    .div(new BN(1_000_000));

  const handleBuy = async () => {
    await onBuy(listing.account.vault, listing.account.seller);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Buy Listing">
      <div className="space-y-4">
        {/* Vault info */}
        <div className="flex items-center justify-between">
          <p className="text-white font-sans text-base">{vaultName}</p>
          <p className="text-white/40 font-mono text-xs">{sellerAddr}</p>
        </div>

        {/* Details */}
        <div className="bg-white/[0.04] rounded-xl p-4 space-y-3">
          <div className="flex justify-between font-mono text-sm">
            <span className="text-white/40">Amount</span>
            <span className="text-white">{formatTokens(listing.account.amount)} tokens</span>
          </div>
          <div className="flex justify-between font-mono text-sm">
            <span className="text-white/40">Price per token</span>
            <span className="text-white">{formatUsdc(listing.account.pricePerToken)}</span>
          </div>
          <div className="border-t border-white/[0.08]" />
          <div className="flex justify-between font-mono text-sm">
            <span className="text-white/40">Total</span>
            <span className="text-accent font-bold">{formatUsdc(total)}</span>
          </div>
        </div>

        {/* Buy button */}
        <button
          onClick={handleBuy}
          disabled={buying}
          className="bg-accent text-white w-full py-3 rounded-xl font-mono text-sm transition-colors hover:bg-accent/80 disabled:opacity-50"
        >
          {buying ? "Processing..." : `Buy for ${formatUsdc(total)}`}
        </button>
      </div>
    </BottomSheet>
  );
}
