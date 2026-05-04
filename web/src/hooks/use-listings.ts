"use client";

import { useEffect, useState, useCallback } from "react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useOxarProgram } from "./use-oxar-program";

export interface ListingAccount {
  publicKey: PublicKey;
  account: {
    seller: PublicKey;
    vault: PublicKey;
    tokenMint: PublicKey;
    amount: BN;
    pricePerToken: BN;
    createdAt: BN;
    bump: number;
  };
}

export function useListings() {
  const { program } = useOxarProgram();
  const [listings, setListings] = useState<ListingAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    if (!program) {
      setListings([]);
      setLoading(false);
      return;
    }

    try {
      const allListings = await program.account.listing.all();
      setListings(allListings as unknown as ListingAccount[]);
      setError(null);
    } catch (err: any) {
      console.error("Failed to fetch listings:", err);
      setError(err.message || "Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, loading, error, refetch: fetchListings };
}
