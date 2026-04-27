"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

import { ListingAccount } from "@/hooks/use-listings";
import {
  findVaultConfig,
  formatTokens,
  formatUsdc,
  shortenAddress,
} from "@/lib/format";
import { getBondColor } from "@/lib/bond-constants";
import { getBondName } from "@/lib/bond-labels";
import { TokenMark } from "@/components/explore/token-mark";

interface ListingCardProps {
  listing: ListingAccount;
  isOwn: boolean;
}

export function ListingCard({ listing, isOwn }: ListingCardProps) {
  const config = findVaultConfig(listing.account.vault.toBase58());
  const denomination = config?.denomination ?? "UAH";
  const { color, rgb } = getBondColor(denomination);
  const sellerAddr = shortenAddress(listing.account.seller.toBase58());

  const total = listing.account.amount
    .mul(listing.account.pricePerToken)
    .div(new BN(1_000_000));

  return (
    <Link
      href={`/marketplace/${listing.publicKey.toBase58()}`}
      className="rounded-[5px] border border-white/10 bg-surface-0 p-5 transition-colors hover:border-white/20 block"
      style={{ boxShadow: `0 0 40px rgba(${rgb},0.04)` }}
    >
      <div className="flex items-start gap-4">
        <TokenMark symbol={denomination} color={color} rgb={rgb} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-base text-white">
              ox{denomination}
            </span>
            {config?.isWar && (
              <span
                className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded"
                style={{ color, background: `rgba(${rgb},0.1)` }}
              >
                WAR
              </span>
            )}
          </div>
          <span className="font-mono text-[10px] text-white/30 uppercase block truncate">
            {config ? getBondName(config) : "Government Bond"}
          </span>
        </div>
        <div className="text-right shrink-0">
          <span className="font-mono text-[10px] text-white/25 uppercase tracking-wide block">
            Seller
          </span>
          <span className="font-mono text-[10px] text-white/50 mt-0.5 block">
            {isOwn ? "You" : sellerAddr}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-3 gap-3 font-mono text-xs">
        <div>
          <span className="text-white/30 text-[10px] uppercase tracking-wide block">
            Amount
          </span>
          <span className="text-white/80 mt-0.5 block truncate">
            {formatTokens(listing.account.amount)}
          </span>
        </div>
        <div>
          <span className="text-white/30 text-[10px] uppercase tracking-wide block">
            Price
          </span>
          <span className="text-white/80 mt-0.5 block truncate">
            {formatUsdc(listing.account.pricePerToken)}
          </span>
        </div>
        <div className="text-right">
          <span className="text-white/30 text-[10px] uppercase tracking-wide block">
            Total
          </span>
          <span className="mt-0.5 block truncate" style={{ color }}>
            {formatUsdc(total)}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-end">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40 inline-flex items-center gap-1.5">
          {isOwn ? "Manage" : "View details"}
          <ArrowRight size={12} />
        </span>
      </div>
    </Link>
  );
}
