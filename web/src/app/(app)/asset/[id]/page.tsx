"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useYieldPositions } from "@/hooks/use-yield-positions";
import { isPriceExposure } from "@/lib/yield/assets";
import { AssetDetail } from "@/components/asset-detail";
import { noteFor } from "@/components/banknote-bg";

export default function AssetPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { views, loading, refresh } = useYieldPositions();
  const baseView = views.find((v) => v.id === id);

  // Stablecoin-market switcher — ONLY for grouped YIELD protocols (Jupiter Lend
  // USDC/USDT/USDG). Price-exposure groups (xStocks all share group "xstocks")
  // are NOT variants of one market, so never show the picker there.
  const [variantId, setVariantId] = useState<string | null>(null);
  const grouped = !!baseView?.group && !isPriceExposure(baseView.id);
  const variants = grouped ? views.filter((v) => v.group === baseView!.group) : [];
  const view = variants.find((v) => v.id === variantId) ?? baseView;

  return (
    <div className="pt-2">
      <button
        onClick={() => router.back()}
        className="lowercase text-[14px] text-black/40 transition-colors hover:text-black"
      >
        ← back
      </button>

      {loading && !view ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-black/30" size={24} />
        </div>
      ) : !view ? (
        <div className="py-24 text-center">
          <p className="text-[18px]">asset not found</p>
          <p className="mt-1 lowercase text-[14px] text-black/45">this asset isn&apos;t in the catalog.</p>
        </div>
      ) : (
        <AssetDetail
          view={view}
          variants={variants.length > 1 ? variants : undefined}
          onSelectVariant={setVariantId}
          onDone={refresh}
        />
      )}

      {/* faint banknote engraving as a page sign-off (matches the asset's card bill) */}
      {view && (
        <div aria-hidden className="pointer-events-none relative mt-16 h-48 select-none overflow-hidden md:h-64">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={noteFor(id)}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-[0.09]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white via-white/40 to-transparent" />
        </div>
      )}
    </div>
  );
}
