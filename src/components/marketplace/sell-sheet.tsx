"use client";

import { useState } from "react";

import { BottomSheet } from "@/components/bottom-sheet";
import { usePortfolio, PortfolioPosition } from "@/hooks/use-portfolio";
import { findVaultConfig } from "@/lib/format";

interface SellSheetProps {
  open: boolean;
  onClose: () => void;
  onCreateListing: (vaultId: string, amount: string, price: string) => void;
  creating: boolean;
}

function getVaultIdFromPosition(position: PortfolioPosition): string | undefined {
  const config = findVaultConfig(position.vault.publicKey.toBase58());
  return config?.id;
}

export function SellSheet({ open, onClose, onCreateListing, creating }: SellSheetProps) {
  const { positions } = usePortfolio();
  const [selectedVaultId, setSelectedVaultId] = useState("");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");

  const positionsWithConfig = positions
    .map((p) => ({ position: p, vaultId: getVaultIdFromPosition(p) }))
    .filter((p): p is { position: PortfolioPosition; vaultId: string } => !!p.vaultId);

  const handleSubmit = () => {
    if (!selectedVaultId || !amount || !price) return;
    onCreateListing(selectedVaultId, amount, price);
    setAmount("");
    setPrice("");
    onClose();
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Create Listing">
      <div className="space-y-4">
        {/* Vault selector */}
        <div>
          <label className="text-white/40 font-mono text-xs block mb-1.5">
            Select Vault
          </label>
          <select
            value={selectedVaultId}
            onChange={(e) => setSelectedVaultId(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent/50 appearance-none"
          >
            <option value="" className="bg-surface-1">
              Choose a vault...
            </option>
            {positionsWithConfig.map(({ position, vaultId }) => {
              const config = findVaultConfig(position.vault.publicKey.toBase58());
              return (
                <option key={vaultId} value={vaultId} className="bg-surface-1">
                  {config?.label || vaultId}
                </option>
              );
            })}
          </select>
        </div>

        {/* Amount input */}
        <div>
          <label className="text-white/40 font-mono text-xs block mb-1.5">
            Amount (tokens)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="any"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent/50 placeholder:text-white/20"
          />
        </div>

        {/* Price input */}
        <div>
          <label className="text-white/40 font-mono text-xs block mb-1.5">
            Price per token (USDC)
          </label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="1.00"
            min="0"
            step="any"
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-accent/50 placeholder:text-white/20"
          />
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={creating || !selectedVaultId || !amount || !price}
          className="bg-accent text-white w-full py-3 rounded-xl font-mono text-sm transition-colors hover:bg-accent/80 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Listing"}
        </button>

        {positionsWithConfig.length === 0 && (
          <p className="text-white/30 font-mono text-xs text-center">
            No vault positions found. Deposit into a vault first.
          </p>
        )}
      </div>
    </BottomSheet>
  );
}
