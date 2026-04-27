"use client";

import { useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { useListings, ListingAccount } from "@/hooks/use-listings";
import { useCancelListing } from "@/hooks/use-cancel-listing";
import { useCreateListing } from "@/hooks/use-create-listing";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { VAULT_CONFIGS } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";
import { findVaultConfig } from "@/lib/format";
import { ListingCard } from "@/components/marketplace/listing-card";
import { SellSheet } from "@/components/marketplace/sell-sheet";
import { BondFilterChip } from "@/components/explore/bond-filter-chip";

const CURRENCY_FILTERS = ["ALL", "UAH", "USD", "EUR"] as const;
type CurrencyFilter = (typeof CURRENCY_FILTERS)[number];

export default function MarketplacePage() {
  const { listings, loading: listingsLoading, refetch: refetchListings } = useListings();
  const { cancelListing, loading: cancelling, error: cancelError } = useCancelListing();
  const { createListing, loading: creating, error: createError } = useCreateListing();
  const { walletAddress } = useOxarProgram();

  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [sellSheetOpen, setSellSheetOpen] = useState(false);
  const [filter, setFilter] = useState<CurrencyFilter>("ALL");

  const handleCreateListing = async (
    vaultId: string,
    amount: string,
    price: string,
  ): Promise<boolean> => {
    const config = VAULT_CONFIGS.find((v) => v.id === vaultId);
    if (!config || !amount || !price) return false;

    const amountFloat = parseFloat(amount);
    const priceFloat = parseFloat(price);
    if (
      isNaN(amountFloat) ||
      isNaN(priceFloat) ||
      amountFloat <= 0 ||
      priceFloat <= 0
    ) {
      return false;
    }

    const [vaultPda] = deriveVaultPda(
      config.region,
      config.denomination,
      config.assetSubtype,
      config.series,
    );
    const amountBn = new BN(Math.floor(amountFloat * 1_000_000));
    const priceBn = new BN(Math.floor(priceFloat * 1_000_000));

    const tx = await createListing(vaultPda, amountBn, priceBn);
    if (!tx) return false;
    await refetchListings();
    // Make sure the user lands on SELL tab so the new listing is visible
    setActiveTab("sell");
    return true;
  };

  const handleCancel = async (vaultPubkey: PublicKey) => {
    const tx = await cancelListing(vaultPubkey);
    if (tx) refetchListings();
  };

  const filterListings = (items: ListingAccount[]) => {
    if (filter === "ALL") return items;
    return items.filter((l) => {
      const config = findVaultConfig(l.account.vault.toBase58());
      return config?.denomination === filter;
    });
  };

  const walletAddr = walletAddress?.toBase58();
  const othersListings = filterListings(
    listings.filter((l) => l.account.seller.toBase58() !== walletAddr),
  );
  const ownListings = filterListings(
    listings.filter((l) => l.account.seller.toBase58() === walletAddr),
  );

  const combinedError = createError || cancelError;
  const currentList = activeTab === "buy" ? othersListings : ownListings;

  return (
    <div className="max-w-[720px] mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          Trade vault tokens with other users
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-white/10">
        {(["buy", "sell"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`font-mono text-[11px] uppercase tracking-[0.15em] px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab
                ? "border-white text-white"
                : "border-transparent text-white/30 hover:text-white/60"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {CURRENCY_FILTERS.map((f) => (
          <BondFilterChip
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </BondFilterChip>
        ))}
      </div>

      {combinedError && (
        <div className="rounded-[5px] border border-loss/30 bg-loss/[0.05] px-4 py-3">
          <p className="font-mono text-[11px] text-loss">{combinedError}</p>
        </div>
      )}

      {listingsLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={18} className="animate-spin text-white/30" />
        </div>
      ) : currentList.length === 0 ? (
        <div className="rounded-[5px] border border-dashed border-white/10 bg-surface-0 p-10 flex flex-col items-center text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 mb-3">
            [ Empty ]
          </span>
          <p className="font-sans text-base text-white">
            {activeTab === "buy" ? "No listings yet" : "You have no active listings"}
          </p>
          {activeTab === "buy" && (
            <Link
              href="/vaults"
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-[5px] font-mono text-[10px] uppercase tracking-[0.15em] border border-white/10 text-white hover:border-white/20 transition-colors"
            >
              Explore vaults →
            </Link>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {currentList.map((listing) => (
            <ListingCard
              key={listing.publicKey.toBase58()}
              listing={listing}
              isOwn={activeTab === "sell"}
              onCancel={() => handleCancel(listing.account.vault)}
              cancelling={cancelling}
            />
          ))}
        </div>
      )}

      {activeTab === "sell" && (
        <button
          onClick={() => setSellSheetOpen(true)}
          className="w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] bg-white text-black hover:bg-white/90 transition-colors"
        >
          Create Listing
        </button>
      )}

      <SellSheet
        open={sellSheetOpen}
        onClose={() => setSellSheetOpen(false)}
        onCreateListing={handleCreateListing}
        creating={creating}
        error={createError}
      />
    </div>
  );
}
