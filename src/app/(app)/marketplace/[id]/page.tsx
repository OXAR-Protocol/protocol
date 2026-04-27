"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

import { useListings } from "@/hooks/use-listings";
import { useVaults, VaultAccount } from "@/hooks/use-vaults";
import { useBuyListing } from "@/hooks/use-buy-listing";
import { useCancelListing } from "@/hooks/use-cancel-listing";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import {
  bnToDecimal,
  findVaultConfig,
  formatUsdc,
  shortenAddress,
} from "@/lib/format";
import { getBondColor } from "@/lib/bond-constants";
import { TokenMark } from "@/components/explore/token-mark";
import { BondDetailView } from "@/components/bond-detail/bond-detail-view";

const USDC_RGB = "255,255,255";
const USDC_COLOR = "#ffffff";

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { listings, loading: listingsLoading, refetch } = useListings();
  const { vaults, loading: vaultsLoading } = useVaults();
  const { walletAddress } = useOxarProgram();
  const { buyListing, loading: buying, error: buyError } = useBuyListing();
  const { cancelListing, loading: cancelling, error: cancelError } =
    useCancelListing();
  const [purchased, setPurchased] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const listing = useMemo(
    () => listings.find((l) => l.publicKey.toBase58() === params.id),
    [listings, params.id],
  );

  const vaultByPk = useMemo(() => {
    const map = new Map<string, VaultAccount>();
    for (const v of vaults) map.set(v.publicKey.toBase58(), v);
    return map;
  }, [vaults]);

  const vault = listing ? vaultByPk.get(listing.account.vault.toBase58()) : null;
  const config = listing ? findVaultConfig(listing.account.vault.toBase58()) : null;

  const denomination = config?.denomination ?? "UAH";
  const { color, rgb } = getBondColor(denomination);

  const isOwn =
    !!listing && listing.account.seller.toBase58() === walletAddress?.toBase58();

  const amountTokens = listing ? bnToDecimal(listing.account.amount, 6) : 0;
  const priceFloat = listing ? bnToDecimal(listing.account.pricePerToken, 6) : 0;
  const total = listing
    ? listing.account.amount
        .mul(listing.account.pricePerToken)
        .div(new BN(1_000_000))
    : new BN(0);

  const handleBuy = async () => {
    if (!listing) return;
    const sig = await buyListing(listing.account.vault, listing.account.seller);
    if (sig) {
      setPurchased(true);
      await refetch();
    }
  };

  const handleCancel = async () => {
    if (!listing) return;
    const sig = await cancelListing(listing.account.vault);
    if (sig) {
      setCancelled(true);
      await refetch();
    }
  };

  // After a successful action, redirect somewhere sensible
  useEffect(() => {
    if (!purchased) return;
    const t = setTimeout(() => router.push("/portfolio"), 1800);
    return () => clearTimeout(t);
  }, [purchased, router]);

  useEffect(() => {
    if (!cancelled) return;
    const t = setTimeout(() => router.push("/marketplace"), 1500);
    return () => clearTimeout(t);
  }, [cancelled, router]);

  if (listingsLoading || vaultsLoading) {
    return (
      <div className="max-w-[720px] mx-auto py-16 flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-white/30" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="max-w-[720px] mx-auto py-8 space-y-6">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60"
        >
          <ArrowLeft size={12} />
          Back to marketplace
        </Link>
        <div className="rounded-[5px] border border-dashed border-white/10 bg-surface-0 p-10 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-3">
            [ Not found ]
          </span>
          <p className="font-sans text-base text-white">
            This listing is no longer available
          </p>
          <p className="font-mono text-[11px] text-white/40 mt-2">
            It may have been bought or cancelled
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto py-8 space-y-6">
      <BondDetailView vault={vault ?? null} config={config ?? null} />

      {/* Listing terms */}
      <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            Listing terms
          </h2>
          <span className="font-mono text-[10px] text-white/30 uppercase tracking-wide">
            from {isOwn ? "you" : shortenAddress(listing.account.seller.toBase58())}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <TokenMark symbol={denomination} color={color} rgb={rgb} size="sm" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-white/50">
              Amount
            </span>
          </div>
          <div className="flex-1 flex flex-col items-end min-w-0">
            <span className="font-mono text-2xl font-light text-white tabular-nums">
              {amountTokens.toLocaleString("en-US", { maximumFractionDigits: 4 })}
            </span>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wide mt-0.5">
              tokens
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 shrink-0">
            <TokenMark symbol="USDC" color={USDC_COLOR} rgb={USDC_RGB} size="sm" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-white/50">
              Price per token
            </span>
          </div>
          <div className="flex-1 flex flex-col items-end min-w-0">
            <span className="font-mono text-2xl font-light text-white tabular-nums">
              {priceFloat.toLocaleString("en-US", { maximumFractionDigits: 6 })}
            </span>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wide mt-0.5">
              ${priceFloat.toLocaleString("en-US", { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Total + CTA */}
      <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6 space-y-4">
        <div className="flex justify-between items-baseline">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
            {isOwn ? "You receive" : "You pay"}
          </span>
          <span className="font-mono text-3xl font-light text-white tabular-nums">
            {formatUsdc(total)}
          </span>
        </div>

        {!isOwn && (
          <p className="font-mono text-[10px] text-white/30 leading-relaxed">
            USDC will be debited on confirmation. The Privy popup may show your
            wallet balance, not the transaction amount — the real charge is the
            figure above.
          </p>
        )}

        {isOwn ? (
          <button
            onClick={handleCancel}
            disabled={cancelling || cancelled}
            className={`w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 border ${
              cancelling || cancelled
                ? "bg-white/[0.04] text-white/30 cursor-not-allowed border-white/5"
                : "border-loss/30 text-loss hover:bg-loss/5"
            }`}
          >
            {cancelling ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Cancelling
              </>
            ) : cancelled ? (
              "Cancelled — back to marketplace…"
            ) : (
              "Cancel listing"
            )}
          </button>
        ) : (
          <button
            onClick={handleBuy}
            disabled={buying || purchased || !walletAddress}
            className={`w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 ${
              buying || purchased
                ? "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/5"
                : "bg-white text-black hover:bg-white/90"
            }`}
          >
            {buying ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Buying
              </>
            ) : purchased ? (
              "Purchased — opening portfolio…"
            ) : (
              `Buy for ${formatUsdc(total)}`
            )}
          </button>
        )}

        {(buyError || cancelError) && (
          <div className="rounded-[5px] border border-loss/30 bg-loss/[0.05] px-4 py-3">
            <p className="font-mono text-[11px] text-loss">
              {buyError || cancelError}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
