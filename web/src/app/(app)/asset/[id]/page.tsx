"use client";

import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useYieldPositions } from "@/hooks/use-yield-positions";
import { AssetDetail } from "@/components/asset-detail";

export default function AssetPage() {
  const params = useParams();
  const id = String(params.id);
  const router = useRouter();
  const { views, loading, refresh } = useYieldPositions();
  const view = views.find((v) => v.id === id);

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
        <AssetDetail view={view} onDone={refresh} />
      )}
    </div>
  );
}
