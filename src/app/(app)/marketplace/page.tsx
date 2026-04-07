"use client";

import { useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";

import { useListings } from "@/hooks/use-listings";
import { useBuyListing } from "@/hooks/use-buy-listing";
import { useCancelListing } from "@/hooks/use-cancel-listing";
import { useCreateListing } from "@/hooks/use-create-listing";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { SectionLabel } from "@/components/section-label";
import { VAULT_CONFIGS } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";
import { findVaultConfig } from "@/lib/format";
import { ListingCard } from "@/components/marketplace/listing-card";
import { BuySheet } from "@/components/marketplace/buy-sheet";
import { SellSheet } from "@/components/marketplace/sell-sheet";
import { FilterChips } from "@/components/explore/filter-chips";
import { ListingAccount } from "@/hooks/use-listings";

export default function MarketplacePage() {
  const { listings, loading: listingsLoading, refetch: refetchListings } = useListings();
  const { buyListing, loading: buying, error: buyError } = useBuyListing();
  const { cancelListing, loading: cancelling, error: cancelError } = useCancelListing();
  const { createListing, loading: creating, error: createError } = useCreateListing();
  const { walletAddress } = useOxarProgram();

  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [selectedListing, setSelectedListing] = useState<ListingAccount | null>(null);
  const [sellSheetOpen, setSellSheetOpen] = useState(false);
  const [filter, setFilter] = useState("All");

  // --- Transaction handlers (preserved from original) ---

  const handleCreateListing = (vaultId: string, amount: string, price: string) => {
    const config = VAULT_CONFIGS.find((v) => v.id === vaultId);
    if (!config || !amount || !price) return;

    const amountFloat = parseFloat(amount);
    const priceFloat = parseFloat(price);
    if (isNaN(amountFloat) || isNaN(priceFloat) || amountFloat <= 0 || priceFloat <= 0) return;

    const [vaultPda] = deriveVaultPda(config.region, config.denomination, config.assetSubtype);
    const amountBn = new BN(Math.floor(amountFloat * 1_000_000));
    const priceBn = new BN(Math.floor(priceFloat * 1_000_000));

    createListing(vaultPda, amountBn, priceBn).then((tx) => {
      if (tx) refetchListings();
    });
  };

  const handleBuy = async (vaultPubkey: PublicKey, sellerPubkey: PublicKey) => {
    const tx = await buyListing(vaultPubkey, sellerPubkey);
    if (tx) refetchListings();
  };

  const handleCancel = async (vaultPubkey: PublicKey) => {
    const tx = await cancelListing(vaultPubkey);
    if (tx) refetchListings();
  };

  // --- Filtering ---

  const filterListings = (items: ListingAccount[]) => {
    if (filter === "All") return items;
    return items.filter((l) => {
      const config = findVaultConfig(l.account.vault.toBase58());
      if (!config) return false;
      if (filter === "Highest APY" || filter === "Short-term") return true;
      return config.denomination === filter;
    });
  };

  const walletAddr = walletAddress?.toBase58();
  const othersListings = filterListings(
    listings.filter((l) => l.account.seller.toBase58() !== walletAddr)
  );
  const ownListings = filterListings(
    listings.filter((l) => l.account.seller.toBase58() === walletAddr)
  );

  const combinedError = createError || buyError || cancelError;

  return (
    <div className="flex flex-col gap-5 px-4 pb-28 pt-4">
      {/* Header */}
      <div>
        <SectionLabel>Marketplace</SectionLabel>
        <p className="text-white/40 font-mono text-xs mt-2">
          Trade vault tokens with other users
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/[0.08]">
        <button
          onClick={() => setActiveTab("buy")}
          className={`flex-1 pb-2.5 font-mono text-sm transition-colors ${
            activeTab === "buy"
              ? "border-b-2 border-accent text-white"
              : "text-white/40"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setActiveTab("sell")}
          className={`flex-1 pb-2.5 font-mono text-sm transition-colors ${
            activeTab === "sell"
              ? "border-b-2 border-accent text-white"
              : "text-white/40"
          }`}
        >
          Sell
        </button>
      </div>

      {/* Filter chips */}
      <FilterChips active={filter} onChange={setFilter} />

      {/* Error */}
      {combinedError && (
        <div className="bg-loss/10 border border-loss/30 rounded-xl px-4 py-3">
          <p className="text-loss font-mono text-xs">{combinedError}</p>
        </div>
      )}

      {/* Buy tab */}
      {activeTab === "buy" && (
        <div className="flex flex-col gap-3">
          {listingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : othersListings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-white/30 font-mono text-sm text-center">
                No listings yet.
              </p>
              <Link
                href="/vaults"
                className="text-accent font-mono text-sm hover:underline"
              >
                Explore vaults to invest directly &rarr;
              </Link>
            </div>
          ) : (
            othersListings.map((listing) => (
              <ListingCard
                key={listing.publicKey.toBase58()}
                listing={listing}
                isOwn={false}
                onBuy={() => setSelectedListing(listing)}
                onCancel={() => {}}
                buying={buying}
                cancelling={false}
              />
            ))
          )}
        </div>
      )}

      {/* Sell tab */}
      {activeTab === "sell" && (
        <div className="flex flex-col gap-3">
          {listingsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : ownListings.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-white/30 font-mono text-sm text-center">
                You have no active listings.
              </p>
            </div>
          ) : (
            ownListings.map((listing) => (
              <ListingCard
                key={listing.publicKey.toBase58()}
                listing={listing}
                isOwn={true}
                onBuy={() => {}}
                onCancel={() => handleCancel(listing.account.vault)}
                buying={false}
                cancelling={cancelling}
              />
            ))
          )}

          {/* Create listing button */}
          <button
            onClick={() => setSellSheetOpen(true)}
            className="w-full bg-accent text-white py-3 rounded-xl font-mono text-sm transition-colors hover:bg-accent/80"
          >
            Create Listing
          </button>
        </div>
      )}

      {/* Buy sheet */}
      <BuySheet
        listing={selectedListing}
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        onBuy={handleBuy}
        buying={buying}
      />

      {/* Sell sheet */}
      <SellSheet
        open={sellSheetOpen}
        onClose={() => setSellSheetOpen(false)}
        onCreateListing={handleCreateListing}
        creating={creating}
      />
    </div>
  );
}
