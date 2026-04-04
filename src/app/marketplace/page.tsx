"use client";

import { useState } from "react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListings } from "@/hooks/use-listings";
import { useVaults } from "@/hooks/use-vaults";
import { useBuyListing } from "@/hooks/use-buy-listing";
import { useCancelListing } from "@/hooks/use-cancel-listing";
import { useCreateListing } from "@/hooks/use-create-listing";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import { VAULT_CONFIGS, VaultConfig } from "@/lib/constants";
import { deriveVaultPda } from "@/lib/pda";

function formatUsdc(amount: BN): string {
  const val = amount.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(val);
}

function formatTokens(amount: BN): string {
  const val = amount.toNumber() / 1_000_000;
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 }).format(val);
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function findVaultConfig(vaultPubkey: string, vaults: any[]): VaultConfig | undefined {
  for (const config of VAULT_CONFIGS) {
    const [pda] = deriveVaultPda(config.region, config.denomination, config.assetSubtype);
    if (pda.toBase58() === vaultPubkey) {
      return config;
    }
  }
  return undefined;
}

export default function MarketplacePage() {
  const { listings, loading: listingsLoading, refetch: refetchListings } = useListings();
  const { vaults } = useVaults();
  const { buyListing, loading: buying, error: buyError } = useBuyListing();
  const { cancelListing, loading: cancelling, error: cancelError } = useCancelListing();
  const { createListing, loading: creating, error: createError } = useCreateListing();
  const { walletAddress } = useOxarProgram();

  const [selectedVault, setSelectedVault] = useState(VAULT_CONFIGS[0]?.id || "");
  const [listAmount, setListAmount] = useState("");
  const [listPrice, setListPrice] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreateListing = async () => {
    setActionError(null);
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
    setActionError(null);
    const tx = await buyListing(vaultPubkey, sellerPubkey);
    if (tx) refetchListings();
  };

  const handleCancel = async (vaultPubkey: PublicKey) => {
    setActionError(null);
    const tx = await cancelListing(vaultPubkey);
    if (tx) refetchListings();
  };

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
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Active Listings</CardTitle>
              </CardHeader>
              <CardContent>
                {listingsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-[#00D4AA]" />
                  </div>
                ) : listings.length === 0 ? (
                  <p className="py-8 text-center text-gray-500">
                    No active listings. Be the first to create one.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Vault</TableHead>
                          <TableHead className="text-gray-400">Seller</TableHead>
                          <TableHead className="text-gray-400 text-right">Amount</TableHead>
                          <TableHead className="text-gray-400 text-right">Price/Token</TableHead>
                          <TableHead className="text-gray-400 text-right">Total</TableHead>
                          <TableHead className="text-gray-400 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((listing) => {
                          const vaultConfig = findVaultConfig(
                            listing.account.vault.toBase58(),
                            vaults
                          );
                          const isOwn =
                            walletAddress &&
                            listing.account.seller.toBase58() ===
                              walletAddress.toBase58();
                          const total = new BN(
                            listing.account.amount
                              .mul(listing.account.pricePerToken)
                              .div(new BN(1_000_000))
                          );

                          return (
                            <TableRow
                              key={listing.publicKey.toBase58()}
                              className="border-gray-800"
                            >
                              <TableCell className="text-gray-200">
                                {vaultConfig ? (
                                  <div>
                                    <p className="font-medium">{vaultConfig.label}</p>
                                    <p className="text-xs text-gray-500 font-mono">
                                      {vaultConfig.id}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="text-xs font-mono text-gray-500">
                                    {shortenAddress(listing.account.vault.toBase58())}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-gray-400">
                                {shortenAddress(listing.account.seller.toBase58())}
                                {isOwn && (
                                  <Badge className="ml-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                                    You
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-gray-200">
                                {formatTokens(listing.account.amount)}
                              </TableCell>
                              <TableCell className="text-right text-gray-200">
                                {formatUsdc(listing.account.pricePerToken)}
                              </TableCell>
                              <TableCell className="text-right font-medium text-white">
                                {formatUsdc(total)}
                              </TableCell>
                              <TableCell className="text-right">
                                {isOwn ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      handleCancel(listing.account.vault)
                                    }
                                    disabled={cancelling}
                                    className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                                  >
                                    {cancelling ? "..." : "Cancel"}
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleBuy(
                                        listing.account.vault,
                                        listing.account.seller
                                      )
                                    }
                                    disabled={buying}
                                    className="bg-[#00D4AA] text-gray-950 hover:bg-[#00B892]"
                                  >
                                    {buying ? "..." : "Buy"}
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-gray-800 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-white">Create Listing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Vault</label>
                  <select
                    value={selectedVault}
                    onChange={(e) => setSelectedVault(e.target.value)}
                    className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white focus:border-[#00D4AA] focus:outline-none"
                  >
                    {VAULT_CONFIGS.map((config) => (
                      <option key={config.id} value={config.id}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Token Amount
                  </label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={listAmount}
                    onChange={(e) => setListAmount(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Price per Token (USDC)
                  </label>
                  <Input
                    type="number"
                    placeholder="1.00"
                    value={listPrice}
                    onChange={(e) => setListPrice(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
                    min="0"
                    step="0.01"
                  />
                </div>

                <Button
                  onClick={handleCreateListing}
                  disabled={creating || !listAmount || !listPrice}
                  className="w-full bg-[#00D4AA] text-gray-950 font-semibold hover:bg-[#00B892] disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Listing"}
                </Button>

                {(createError || actionError || buyError || cancelError) && (
                  <p className="text-xs text-red-400">{createError || actionError || buyError || cancelError}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
