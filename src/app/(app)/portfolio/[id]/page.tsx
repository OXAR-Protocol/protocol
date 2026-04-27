"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { BN } from "@coral-xyz/anchor";

import { usePortfolio } from "@/hooks/use-portfolio";
import { useListings } from "@/hooks/use-listings";
import { useClaim } from "@/hooks/use-claim";
import { useCreateListing } from "@/hooks/use-create-listing";
import { useOxarProgram } from "@/hooks/use-oxar-program";
import {
  bnToDecimal,
  findVaultConfig,
  formatTokens,
  formatUsdc,
} from "@/lib/format";
import { getBondColor } from "@/lib/bond-constants";
import { TokenMark } from "@/components/explore/token-mark";
import { BondDetailView } from "@/components/bond-detail/bond-detail-view";
import { SellSheet } from "@/components/marketplace/sell-sheet";

export default function PositionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const { positions, loading, refetch } = usePortfolio();
  const { listings } = useListings();
  const { walletAddress } = useOxarProgram();
  const { claim, loading: claiming, error: claimError } = useClaim();
  const { createListing, loading: creating, error: createError } =
    useCreateListing();

  const [sellSheetOpen, setSellSheetOpen] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const position = useMemo(
    () => positions.find((p) => p.vault.publicKey.toBase58() === params.id),
    [positions, params.id],
  );

  const config = position
    ? findVaultConfig(position.vault.publicKey.toBase58())
    : null;

  const denomination = config?.denomination ?? "UAH";
  const { color, rgb } = getBondColor(denomination);

  // Active listing this user has for this vault, if any
  const ownListing = useMemo(() => {
    if (!position || !walletAddress) return null;
    const sellerStr = walletAddress.toBase58();
    const vaultStr = position.vault.publicKey.toBase58();
    return (
      listings.find(
        (l) =>
          l.account.seller.toBase58() === sellerStr &&
          l.account.vault.toBase58() === vaultStr,
      ) ?? null
    );
  }, [listings, position, walletAddress]);

  const balanceTokens = position ? bnToDecimal(position.balance, 6) : 0;
  const value = position
    ? position.balance
        .mul(position.vault.account.navPerShare)
        .div(new BN(1_000_000))
    : new BN(0);

  const now = Math.floor(Date.now() / 1000);
  const maturityTs = position?.vault.account.maturityTs.toNumber() ?? 0;
  const matured = maturityTs > 0 && now >= maturityTs;

  const handleSell = async (
    vaultId: string,
    amount: string,
    price: string,
  ): Promise<boolean> => {
    if (!position) return false;
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
    // We can ignore vaultId here because the picker is preselected and locked
    // to this position; just use the position's vault PDA directly.
    const amountBn = new BN(Math.floor(amountFloat * 1_000_000));
    const priceBn = new BN(Math.floor(priceFloat * 1_000_000));
    const tx = await createListing(position.vault.publicKey, amountBn, priceBn);
    if (!tx) return false;
    setSellSheetOpen(false);
    await refetch();
    router.push("/marketplace");
    return true;
  };

  const handleClaim = async () => {
    if (!position) return;
    const tx = await claim(position.vault.publicKey);
    if (tx) {
      setClaimed(true);
      await refetch();
    }
  };

  // After a successful claim, return to /portfolio (the position will be gone)
  useEffect(() => {
    if (!claimed) return;
    const t = setTimeout(() => router.push("/portfolio"), 1800);
    return () => clearTimeout(t);
  }, [claimed, router]);

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto py-16 flex items-center justify-center">
        <Loader2 size={18} className="animate-spin text-white/30" />
      </div>
    );
  }

  if (!position) {
    return (
      <div className="max-w-[720px] mx-auto py-8 space-y-6">
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/60"
        >
          <ArrowLeft size={12} />
          Back to portfolio
        </Link>
        <div className="rounded-[5px] border border-dashed border-white/10 bg-surface-0 p-10 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-3">
            [ Not found ]
          </span>
          <p className="font-sans text-base text-white">
            No position found for this vault
          </p>
        </div>
      </div>
    );
  }

  const sellDisabled = !!ownListing || matured;
  const sellHelper = ownListing
    ? "You already have an active listing for this vault. Cancel it from marketplace first."
    : matured
      ? "Position has matured — claim USDC instead of selling."
      : null;

  return (
    <div className="max-w-[720px] mx-auto py-8 space-y-6">
      <BondDetailView
        vault={position.vault}
        config={config ?? null}
        backHref="/portfolio"
        backLabel="Back to portfolio"
      />

      {/* Position summary */}
      <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
            Your position
          </h2>
          {ownListing && (
            <Link
              href={`/marketplace/${ownListing.publicKey.toBase58()}`}
              className="font-mono text-[10px] uppercase tracking-wide px-2.5 py-1 rounded border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors"
            >
              Listed on market →
            </Link>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <TokenMark symbol={denomination} color={color} rgb={rgb} size="sm" />
            <span className="font-mono text-[11px] uppercase tracking-wide text-white/50">
              Balance
            </span>
          </div>
          <div className="flex-1 flex flex-col items-end min-w-0">
            <span className="font-mono text-2xl font-light text-white tabular-nums">
              {balanceTokens.toLocaleString("en-US", {
                maximumFractionDigits: 4,
              })}
            </span>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wide mt-0.5">
              tokens
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-mono text-[11px] uppercase tracking-wide text-white/50">
              Current value
            </span>
          </div>
          <div className="flex-1 flex flex-col items-end min-w-0">
            <span
              className="font-mono text-2xl font-light tabular-nums"
              style={{ color }}
            >
              {formatUsdc(value)}
            </span>
            <span className="font-mono text-[10px] text-white/30 uppercase tracking-wide mt-0.5">
              {formatTokens(position.vault.account.navPerShare)} USDC / token
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-[5px] border border-white/10 bg-surface-0 p-6 space-y-4">
        {matured ? (
          <>
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/40">
                You receive
              </span>
              <span className="font-mono text-3xl font-light text-white tabular-nums">
                {formatUsdc(value)}
              </span>
            </div>
            <p className="font-mono text-[10px] text-white/30 leading-relaxed">
              The bond has matured. Claim redeems your tokens for USDC at face
              value + accrued yield, directly from the vault.
            </p>
            <button
              onClick={handleClaim}
              disabled={claiming || claimed}
              className={`w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 ${
                claiming || claimed
                  ? "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/5"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              {claiming ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Claiming
                </>
              ) : claimed ? (
                "Claimed — opening portfolio…"
              ) : (
                `Claim ${formatUsdc(value)}`
              )}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setSellSheetOpen(true)}
              disabled={sellDisabled}
              className={`w-full py-4 rounded-[5px] font-mono text-xs uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-2 ${
                sellDisabled
                  ? "bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/5"
                  : "bg-white text-black hover:bg-white/90"
              }`}
            >
              List for sale
            </button>
            {sellHelper && (
              <p className="font-mono text-[10px] text-white/30 leading-relaxed text-center">
                {sellHelper}
              </p>
            )}
          </>
        )}

        {(claimError || createError) && (
          <div className="rounded-[5px] border border-loss/30 bg-loss/[0.05] px-4 py-3">
            <p className="font-mono text-[11px] text-loss">
              {claimError || createError}
            </p>
          </div>
        )}
      </div>

      <SellSheet
        open={sellSheetOpen}
        onClose={() => setSellSheetOpen(false)}
        onCreateListing={handleSell}
        creating={creating}
        error={createError}
        preselectVaultId={config?.id}
      />
    </div>
  );
}
