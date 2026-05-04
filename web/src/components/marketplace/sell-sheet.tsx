"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

import { BottomSheet } from "@/components/bottom-sheet";
import { usePortfolio, PortfolioPosition } from "@/hooks/use-portfolio";
import { useListings } from "@/hooks/use-listings";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import {
  bnToDecimal,
  findVaultConfig,
  formatTokens,
  formatUsdc,
} from "@/lib/format";
import { getBondColor } from "@/lib/bond-constants";
import { getBondName } from "@/lib/bond-labels";
import { TokenMark } from "@/components/explore/token-mark";

import {
  PositionSelectModal,
  PositionWithConfig,
  BlockReason,
} from "./position-select-modal";

interface SellSheetProps {
  open: boolean;
  onClose: () => void;
  /** Returns true on confirmed success (tx landed) so the sheet can auto-close. */
  onCreateListing: (
    vaultId: string,
    amount: string,
    price: string,
  ) => Promise<boolean>;
  creating: boolean;
  /** Latest createListing error from the parent hook. Shown inline when the sheet stays open after a failed attempt. */
  error?: string | null;
  /** Optional vault id to preselect when the sheet opens (e.g. from /portfolio/[id]). */
  preselectVaultId?: string;
}

const USDC_RGB = "255,255,255";
const USDC_COLOR = "#ffffff";

function isPositionMatured(position: PortfolioPosition): boolean {
  const maturity = position.vault.account.maturityTs.toNumber();
  if (maturity <= 0) return false;
  return Date.now() / 1000 >= maturity;
}

export function SellSheet({
  open,
  onClose,
  onCreateListing,
  creating,
  error,
  preselectVaultId,
}: SellSheetProps) {
  const { positions } = usePortfolio();
  const { listings } = useListings();
  const { walletAddress } = useOxarProgram();
  const [selectedVaultId, setSelectedVaultId] = useState(preselectVaultId ?? "");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Apply preselect when sheet opens (e.g. portfolio entry point)
  useEffect(() => {
    if (open && preselectVaultId) {
      setSelectedVaultId(preselectVaultId);
    }
  }, [open, preselectVaultId]);

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setAmount("");
      setPrice("");
      setPickerOpen(false);
    }
  }, [open]);

  // Set of vault PDAs (base58) where this seller already has an active listing
  const ownListingVaultIds = useMemo(() => {
    if (!walletAddress) return new Set<string>();
    const sellerStr = walletAddress.toBase58();
    return new Set(
      listings
        .filter((l) => l.account.seller.toBase58() === sellerStr)
        .map((l) => l.account.vault.toBase58()),
    );
  }, [listings, walletAddress]);

  // Per-position block reasons for the picker
  const blockedReasons = useMemo(() => {
    const map: Record<string, BlockReason> = {};
    for (const pos of positions) {
      const vaultPda = pos.vault.publicKey.toBase58();
      if (!pos.vault.account.isActive) {
        map[vaultPda] = "inactive";
      } else if (isPositionMatured(pos)) {
        map[vaultPda] = "matured";
      } else if (ownListingVaultIds.has(vaultPda)) {
        map[vaultPda] = "already-listed";
      }
    }
    return map;
  }, [positions, ownListingVaultIds]);

  const selectedPosition = useMemo<PortfolioPosition | undefined>(() => {
    if (!selectedVaultId) return undefined;
    return positions.find((p) => {
      const config = findVaultConfig(p.vault.publicKey.toBase58());
      return config?.id === selectedVaultId;
    });
  }, [selectedVaultId, positions]);

  const selectedConfig = selectedPosition
    ? findVaultConfig(selectedPosition.vault.publicKey.toBase58())
    : null;

  const selectedBlockReason: BlockReason | undefined = selectedPosition
    ? blockedReasons[selectedPosition.vault.publicKey.toBase58()]
    : undefined;

  const balanceFloat = selectedPosition
    ? bnToDecimal(selectedPosition.balance, 6)
    : 0;

  const parsedAmount = parseFloat(amount);
  const parsedPrice = parseFloat(price);
  const hasAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const hasPrice = !isNaN(parsedPrice) && parsedPrice > 0;
  const overBalance = hasAmount && parsedAmount > balanceFloat;

  const total =
    hasAmount && hasPrice
      ? new BN(Math.floor(parsedAmount * 1_000_000))
          .mul(new BN(Math.floor(parsedPrice * 1_000_000)))
          .div(new BN(1_000_000))
      : new BN(0);

  const canSubmit =
    !!selectedVaultId &&
    !selectedBlockReason &&
    hasAmount &&
    hasPrice &&
    !overBalance &&
    !creating;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const ok = await onCreateListing(selectedVaultId, amount, price);
    if (ok) {
      // Reset and close so the user lands back on the marketplace and sees the new listing
      setSelectedVaultId("");
      setAmount("");
      setPrice("");
      onClose();
    }
    // On failure leave the sheet open — `error` prop renders inline so the user can fix and retry
  };

  const handleSelectPosition = (vaultId: string, _item: PositionWithConfig) => {
    setSelectedVaultId(vaultId);
    setAmount("");
  };

  const handleMax = () => {
    if (!selectedPosition) return;
    setAmount(balanceFloat.toString());
  };

  const pickerColor = selectedConfig
    ? getBondColor(selectedConfig.denomination)
    : null;

  // Submit-button helper text covers each blocking state in priority order
  const submitLabel = (() => {
    if (creating) return null;
    if (!selectedVaultId) return "Select position";
    if (selectedBlockReason === "matured") return "Position is matured";
    if (selectedBlockReason === "inactive") return "Vault is inactive";
    if (selectedBlockReason === "already-listed") return "Already listed";
    if (!hasAmount) return "Enter amount";
    if (overBalance) return "Exceeds balance";
    if (!hasPrice) return "Enter price";
    return `List for ${formatUsdc(total)}`;
  })();

  return (
    <>
      <BottomSheet open={open} onClose={onClose} title="Create Listing">
        <div className="space-y-3">
          {/* Position picker + amount */}
          <div
            className="rounded-[5px] border border-white/10 bg-surface-0 p-5 transition-colors"
            style={
              pickerColor
                ? { boxShadow: `0 0 60px rgba(${pickerColor.rgb},0.05)` }
                : undefined
            }
          >
            <div className="flex items-center justify-between mb-4">
              <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
                Selling
              </label>
              {selectedPosition && !selectedBlockReason && (
                <button
                  onClick={handleMax}
                  className="font-mono text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
                >
                  Max {formatTokens(selectedPosition.balance)}
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-3 shrink-0 group"
              >
                {selectedConfig && pickerColor ? (
                  <>
                    <TokenMark
                      symbol={selectedConfig.denomination}
                      color={pickerColor.color}
                      rgb={pickerColor.rgb}
                    />
                    <div className="flex flex-col min-w-0 items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-base text-white">
                          ox{selectedConfig.denomination}
                        </span>
                        <ChevronDown
                          size={14}
                          className="text-white/40 group-hover:text-white transition-colors"
                        />
                      </div>
                      <span className="font-mono text-[10px] text-white/30 uppercase truncate max-w-[160px]">
                        {getBondName(selectedConfig)}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-[5px] border border-dashed border-white/15 flex items-center justify-center">
                      <span className="font-mono text-[10px] text-white/30">
                        ?
                      </span>
                    </div>
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1.5">
                        <span className="font-sans text-base text-white/60">
                          Select position
                        </span>
                        <ChevronDown
                          size={14}
                          className="text-white/40 group-hover:text-white transition-colors"
                        />
                      </div>
                      <span className="font-mono text-[10px] text-white/30 uppercase">
                        Choose a vault
                      </span>
                    </div>
                  </>
                )}
              </button>

              <div className="flex-1 flex flex-col items-end min-w-0">
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!selectedPosition || !!selectedBlockReason}
                  min="0"
                  step="any"
                  className="bg-transparent text-white font-mono text-3xl font-light w-full outline-none placeholder:text-white/15 text-right min-w-0 disabled:opacity-50 tabular-nums"
                />
                <span
                  className={`font-mono text-[10px] mt-0.5 ${
                    overBalance || selectedBlockReason
                      ? "text-loss"
                      : "text-white/25"
                  }`}
                >
                  {selectedBlockReason === "matured"
                    ? "Matured · claim from Portfolio"
                    : selectedBlockReason === "inactive"
                      ? "Vault is inactive"
                      : selectedBlockReason === "already-listed"
                        ? "You already have a listing here · cancel it first"
                        : overBalance
                          ? "Exceeds balance"
                          : selectedPosition
                            ? `${formatTokens(selectedPosition.balance)} available`
                            : "Pick a position first"}
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
                <input
                  type="number"
                  placeholder="1.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="any"
                  className="bg-transparent text-white font-mono text-3xl font-light w-full outline-none placeholder:text-white/15 text-right min-w-0 tabular-nums"
                />
                <span className="font-mono text-[10px] text-white/25 mt-0.5">
                  {hasPrice
                    ? `$${parsedPrice.toLocaleString("en-US", {
                        maximumFractionDigits: 2,
                      })}`
                    : "$0.00"}
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
                {hasAmount
                  ? `${parsedAmount.toLocaleString("en-US", {
                      maximumFractionDigits: 4,
                    })} tokens`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-white/40 uppercase tracking-wide">
                Price
              </span>
              <span className="text-white/70 tabular-nums">
                {hasPrice
                  ? `$${parsedPrice.toLocaleString("en-US", {
                      maximumFractionDigits: 4,
                    })}`
                  : "—"}
              </span>
            </div>
            <div className="border-t border-white/[0.06]" />
            <div className="flex justify-between font-mono text-sm">
              <span className="text-white/40 uppercase tracking-wide text-[11px]">
                You receive
              </span>
              <span className="text-white font-medium tabular-nums">
                {hasAmount && hasPrice ? formatUsdc(total) : "$0.00"}
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`mt-4 w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 ${
              canSubmit
                ? "bg-white text-black hover:bg-white/90"
                : "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/5"
            }`}
          >
            {creating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Creating
              </>
            ) : (
              submitLabel
            )}
          </button>

          {error && !creating && (
            <div className="rounded-[5px] border border-loss/30 bg-loss/[0.05] px-4 py-3">
              <p className="font-mono text-[11px] text-loss">{error}</p>
            </div>
          )}

          {positions.length === 0 && (
            <p className="text-white/30 font-mono text-[11px] text-center pt-2">
              No vault positions found. Deposit into a vault first.
            </p>
          )}
        </div>
      </BottomSheet>

      <PositionSelectModal
        open={pickerOpen}
        positions={positions}
        selectedVaultId={selectedVaultId}
        blockedReasons={blockedReasons}
        onClose={() => setPickerOpen(false)}
        onSelect={handleSelectPosition}
      />
    </>
  );
}
