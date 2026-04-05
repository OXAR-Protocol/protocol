"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VAULT_CONFIGS } from "@/lib/constants";

interface CreateListingFormProps {
  selectedVault: string;
  listAmount: string;
  listPrice: string;
  creating: boolean;
  error: string | null;
  onSelectedVaultChange: (value: string) => void;
  onListAmountChange: (value: string) => void;
  onListPriceChange: (value: string) => void;
  onSubmit: () => void;
}

export function CreateListingForm({
  selectedVault,
  listAmount,
  listPrice,
  creating,
  error,
  onSelectedVaultChange,
  onListAmountChange,
  onListPriceChange,
  onSubmit,
}: CreateListingFormProps) {
  return (
    <Card className="border-gray-800 bg-gray-900">
      <CardHeader>
        <CardTitle className="text-white">Create Listing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Vault</label>
          <select
            value={selectedVault}
            onChange={(e) => onSelectedVaultChange(e.target.value)}
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
            onChange={(e) => onListAmountChange(e.target.value)}
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
            onChange={(e) => onListPriceChange(e.target.value)}
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-600"
            min="0"
            step="0.01"
          />
        </div>

        <Button
          onClick={onSubmit}
          disabled={creating || !listAmount || !listPrice}
          className="w-full bg-[#00D4AA] text-gray-950 font-semibold hover:bg-[#00B892] disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Listing"}
        </Button>

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}
