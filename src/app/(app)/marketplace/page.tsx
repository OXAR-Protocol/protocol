"use client";

import { useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Nav } from "@/components/nav";
import { useListings } from "@/hooks/use-listings";
import { useBuyListing } from "@/hooks/use-buy-listing";
import { useCancelListing } from "@/hooks/use-cancel-listing";
import { useCreateListing } from "@/hooks/use-create-listing";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { VAULT_CONFIGS } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";
import { ListingsTable } from "@/components/marketplace/listings-table";
import { CreateListingForm } from "@/components/marketplace/create-listing-form";

export default function MarketplacePage() {
  const { listings, loading: listingsLoading, refetch: refetchListings } = useListings();
  const { buyListing, loading: buying, error: buyError } = useBuyListing();
  const { cancelListing, loading: cancelling, error: cancelError } = useCancelListing();
  const { createListing, loading: creating, error: createError } = useCreateListing();
  const { walletAddress } = useOxarProgram();

  const [selectedVault, setSelectedVault] = useState(VAULT_CONFIGS[0]?.id || "");
  const [listAmount, setListAmount] = useState("");
  const [listPrice, setListPrice] = useState("");

  const handleCreateListing = async () => {
    const config = VAULT_CONFIGS.find((v) => v.id === selectedVault);
    if (!config || !listAmount || !listPrice) return;

    const amountFloat = parseFloat(listAmount);
    const priceFloat = parseFloat(listPrice);
    if (isNaN(amountFloat) || isNaN(priceFloat) || amountFloat <= 0 || priceFloat <= 0) return;

    const [vaultPda] = deriveVaultPda(config.region, config.denomination, config.assetSubtype);
    const amountBn = new BN(Math.floor(amountFloat * 1_000_000));
    const priceBn = new BN(Math.floor(priceFloat * 1_000_000));

    const tx = await createListing(vaultPda, amountBn, priceBn);
    if (tx) {
      setListAmount("");
      setListPrice("");
      refetchListings();
    }
  };

  const handleBuy = async (vaultPubkey: PublicKey, sellerPubkey: PublicKey) => {
    const tx = await buyListing(vaultPubkey, sellerPubkey);
    if (tx) refetchListings();
  };

  const handleCancel = async (vaultPubkey: PublicKey) => {
    const tx = await cancelListing(vaultPubkey);
    if (tx) refetchListings();
  };

  const combinedError = createError || buyError || cancelError;

  return (
    <div className="min-h-screen bg-gray-950">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Marketplace</h1>
          <p className="mt-2 text-gray-400">
            Trade vault tokens with other users.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ListingsTable
              listings={listings}
              loading={listingsLoading}
              walletAddress={walletAddress}
              buying={buying}
              cancelling={cancelling}
              onBuy={handleBuy}
              onCancel={handleCancel}
            />
          </div>

          <div>
            <CreateListingForm
              selectedVault={selectedVault}
              listAmount={listAmount}
              listPrice={listPrice}
              creating={creating}
              error={combinedError}
              onSelectedVaultChange={setSelectedVault}
              onListAmountChange={setListAmount}
              onListPriceChange={setListPrice}
              onSubmit={handleCreateListing}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
