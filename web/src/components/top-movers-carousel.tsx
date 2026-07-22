"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useTopMovers } from "@/hooks/use-top-movers";
import { useT } from "@/lib/i18n";

/** Horizontal strip of the biggest 24h movers across stocks + gold. Discovery entry
 *  point on Home — each card opens the asset page. Scrolls horizontally on overflow. */
export function TopMoversCarousel() {
  const { movers, loading } = useTopMovers(10);
  const { t } = useT();

  if (!loading && movers.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-12"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <p className="lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">
          {t("movers.title")}
        </p>
        <Link href="/yield" className="text-xs text-black/45 transition-colors hover:text-black">
          {t("movers.all")}
        </Link>
      </div>

      <div className="-mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[118px] w-[160px] shrink-0 animate-pulse rounded-[12px] border border-black/10 bg-black/[0.03]"
              />
            ))
          : movers.map((m) => {
              const up = m.change24h >= 0;
              return (
                <Link
                  key={m.id}
                  href={`/asset/${m.id}`}
                  className="group flex w-[160px] shrink-0 snap-start flex-col justify-between rounded-[12px] border border-black/10 bg-white p-4 transition-colors hover:border-black/30"
                >
                  <div className="flex items-center justify-between">
                    <AssetIcon src={assetLogoSrc(m.id)} label={assetIconLabel(m.id, m.symbol)} size={30} />
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${
                        up ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      {up ? "+" : ""}
                      {m.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-3 min-w-0">
                    <p className="truncate text-sm text-black">{m.name}</p>
                    <p className="mt-0.5 text-xs tabular-nums text-black/45">
                      ${m.price < 1 ? m.price.toFixed(4) : m.price.toFixed(2)}
                      <span className="text-black/30"> · {m.token}</span>
                    </p>
                  </div>
                </Link>
              );
            })}
      </div>
    </motion.section>
  );
}
