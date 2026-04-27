"use client";

import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Loader2 } from "lucide-react";

import { BottomSheet } from "@/components/bottom-sheet";
import { ListingAccount } from "@/hooks/use-listings";
import {
  bnToDecimal,
  findVaultConfig,
  formatTokens,
  formatUsdc,
  shortenAddress,
} from "@/lib/format";
import { getBondColor } from "@/lib/bond-constants";
import { getBondName } from "@/lib/bond-labels";
import { TokenMark } from "@/components/explore/token-mark";

interface BuySheetProps {
  listing: ListingAccount | null;
  open: boolean;
  onClose: () => void;
  onBuy: (vaultPubkey: PublicKey, sellerPubkey: PublicKey) => Promise<void>;
  buying: boolean;
}

const USDC_RGB = "255,255,255";
const USDC_COLOR = "#ffffff";

export function BuySheet({ listing, open, onClose, onBuy, buying }: BuySheetProps) {
  if (!listing) return null;

  const config = findVaultConfig(listing.account.vault.toBase58());
  const denomination = config?.denomination ?? "UAH";
  const { color, rgb } = getBondColor(denomination);
  const sellerAddr = shortenAddress(listing.account.seller.toBase58());

  const amountTokens = bnToDecimal(listing.account.amount, 6);
  const priceFloat = bnToDecimal(listing.account.pricePerToken, 6);
  const total = listing.account.amount
    .mul(listing.account.pricePerToken)
    .div(new BN(1_000_000));

  const handleBuy = async () => {
    await onBuy(listing.account.vault, listing.account.seller);
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Buy Listing">
      <div className="space-y-3">
        {/* Vault summary */}
        <div
          className="rounded-[5px] border border-white/10 bg-surface-0 p-5 transition-colors"
          style={{ boxShadow: `0 0 60px rgba(${rgb},0.05)` }}
        >
          <div className="flex items-center justify-between mb-4">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
              Buying
            </label>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wide">
              from {sellerAddr}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <TokenMark symbol={denomination} color={color} rgb={rgb} />
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
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
                <span className="font-mono text-[10px] text-white/30 uppercase truncate max-w-[180px]">
                  {config ? getBondName(config) : "Government Bond"}
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-end min-w-0">
              <span className="font-mono text-3xl font-light text-white tabular-nums">
                {amountTokens.toLocaleString("en-US", {
                  maximumFractionDigits: 4,
                })}
              </span>
              <span className="font-mono text-[10px] text-white/25 mt-0.5 uppercase tracking-wide">
                tokens
              </span>
            </div>
          </div>
        </div>

        {/* Price per token */}
        <div className="rounded-[5px] border border-white/10 bg-surface-0 p-5">
          <div className="flex items-center justify-between mb-4">
            <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
              Price per token
            </label>
            <span className="font-mono text-[10px] text-white/20">
              Settled in USDC
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <TokenMark symbol="USDC" color={USDC_COLOR} rgb={USDC_RGB} />
              <div className="flex flex-col min-w-0">
                <span className="font-sans text-base text-white">USDC</span>
                <span className="font-mono text-[10px] text-white/30 uppercase">
                  Per token
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-end min-w-0">
              <span className="font-mono text-3xl font-light text-white tabular-nums">
                {priceFloat.toLocaleString("en-US", {
                  maximumFractionDigits: 6,
                })}
              </span>
              <span className="font-mono text-[10px] text-white/25 mt-0.5">
                ${priceFloat.toLocaleString("en-US", {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Total preview */}
        <div className="rounded-[5px] border border-white/[0.06] bg-white/[0.02] px-5 py-4 space-y-2.5">
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-white/40 uppercase tracking-wide">
              Amount
            </span>
            <span className="text-white/70 tabular-nums">
              {formatTokens(listing.account.amount)} tokens
            </span>
          </div>
          <div className="flex justify-between font-mono text-[11px]">
            <span className="text-white/40 uppercase tracking-wide">
              Price
            </span>
            <span className="text-white/70 tabular-nums">
              {formatUsdc(listing.account.pricePerToken)}
            </span>
          </div>
          <div className="border-t border-white/[0.06]" />
          <div className="flex justify-between font-mono text-sm">
            <span className="text-white/40 uppercase tracking-wide text-[11px]">
              You pay
            </span>
            <span className="text-white font-medium tabular-nums">
              {formatUsdc(total)}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleBuy}
          disabled={buying}
          className={`mt-4 w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 ${
            buying
              ? "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/5"
              : "bg-white text-black hover:bg-white/90"
          }`}
        >
          {buying ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Buying
            </>
          ) : (
            `Buy for ${formatUsdc(total)}`
          )}
        </button>
      </div>
    </BottomSheet>
  );
}
