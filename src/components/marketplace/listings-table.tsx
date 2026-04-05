"use client";

import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
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
import { formatUsdc, formatTokens, shortenAddress, findVaultConfig } from "@/lib/format";

interface ListingsTableProps {
  listings: any[];
  loading: boolean;
  walletAddress: PublicKey | null;
  buying: boolean;
  cancelling: boolean;
  onBuy: (vaultPubkey: PublicKey, sellerPubkey: PublicKey) => void;
  onCancel: (vaultPubkey: PublicKey) => void;
}

export function ListingsTable({
  listings,
  loading,
  walletAddress,
  buying,
  cancelling,
  onBuy,
  onCancel,
}: ListingsTableProps) {
  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Active Listings</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
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
                    listing.account.vault.toBase58()
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
                              onCancel(listing.account.vault)
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
                              onBuy(
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
  );
}
