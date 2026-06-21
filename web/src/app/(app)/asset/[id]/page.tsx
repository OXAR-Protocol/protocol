"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useYieldPositions } from "@/hooks/use-yield-positions";
import { AssetDetail } from "@/components/asset-detail";

export default function AssetPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { views, loading, refresh } = useYieldPositions();
  const baseView = views.find((v) => v.id === id);

  // Grouped protocols (e.g. Jupiter Lend USDC/USDT/USDG) — let the page switch
  // between the stablecoin markets, each with its own APY + deposit target.
  const [variantId, setVariantId] = useState<string | null>(null);
  const variants = baseView?.group ? views.filter((v) => v.group === baseView.group) : [];
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
    </div>
  );
}
