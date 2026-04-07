"use client";

import { BN } from "@coral-xyz/anchor";

import { ListingAccount } from "@/hooks/use-listings";
import { findVaultConfig, formatTokens, formatUsdc, shortenAddress } from "@/lib/format";

interface ListingCardProps {
  listing: ListingAccount;
  isOwn: boolean;
  onBuy: () => void;
  onCancel: () => void;
  buying: boolean;
  cancelling: boolean;
}

export function ListingCard({
  listing,
  isOwn,
  onBuy,
  onCancel,
  buying,
  cancelling,
}: ListingCardProps) {
  const vaultConfig = findVaultConfig(listing.account.vault.toBase58());
  const vaultName = vaultConfig?.label || "Unknown Vault";
  const sellerAddr = shortenAddress(listing.account.seller.toBase58());

  const total = listing.account.amount
    .mul(listing.account.pricePerToken)
    .div(new BN(1_000_000));

  return (
    <div className="bg-surface-1 rounded-xl border border-white/[0.08] p-4">
      {/* Top row: vault name + seller */}
      <div className="flex items-center justify-between">
        <p className="text-white font-sans text-base">{vaultName}</p>
        <p className="text-white/40 font-mono text-xs">
          {sellerAddr}
          {isOwn && <span className="text-accent ml-1">(You)</span>}
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.08] my-3" />

      {/* Middle: amount, price, total */}
      <div className="flex items-center gap-4 text-sm font-mono">
        <div>
          <p className="text-white/40 text-xs">Amount</p>
          <p className="text-white">{formatTokens(listing.account.amount)} tokens</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Price</p>
          <p className="text-white">{formatUsdc(listing.account.pricePerToken)}/token</p>
        </div>
        <div>
          <p className="text-white/40 text-xs">Total</p>
          <p className="text-accent font-bold">{formatUsdc(total)}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.08] my-3" />

      {/* Action button */}
      {isOwn ? (
        <button
          onClick={onCancel}
          disabled={cancelling}
          className="w-full rounded-xl border border-loss/30 text-loss py-2.5 font-mono text-sm transition-colors hover:bg-loss/10 disabled:opacity-50"
        >
          {cancelling ? "Cancelling..." : "Cancel Listing"}
        </button>
      ) : (
        <button
          onClick={onBuy}
          disabled={buying}
          className="w-full rounded-xl bg-accent text-white py-2.5 font-mono text-sm transition-colors hover:bg-accent/80 disabled:opacity-50"
        >
          {buying ? "Buying..." : "Buy"}
        </button>
      )}
    </div>
  );
}
