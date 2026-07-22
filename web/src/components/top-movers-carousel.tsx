"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import { AssetIcon } from "@/components/asset-icon";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useTopMovers } from "@/hooks/use-top-movers";
import { useT } from "@/lib/i18n";

/** Big, clear horizontal strip of the biggest 24h movers across stocks + gold.
 *  Discovery entry point on Home — each card opens the asset page. */
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
      <div className="mb-4 flex items-baseline justify-between">
        <p className="lowercase text-[clamp(15px,1.4vw,20px)] tracking-[-0.02em] text-black">
          {t("movers.title")}
        </p>
        <Link href="/yield" className="text-xs text-black/45 transition-colors hover:text-black">
          {t("movers.all")}
        </Link>
      </div>

      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[168px] w-[210px] shrink-0 animate-pulse rounded-[18px] border border-black/10 bg-black/[0.03]"
              />
            ))
          : movers.map((m) => {
              const up = m.change24h >= 0;
              const Arrow = up ? ArrowUpRight : ArrowDownRight;
              return (
                <Link
                  key={m.id}
                  href={`/asset/${m.id}`}
                  className="group flex w-[210px] shrink-0 snap-start flex-col justify-between rounded-[18px] border border-black/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-black/25 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                >
                  <div className="flex items-start justify-between">
                    <AssetIcon src={assetLogoSrc(m.id)} label={assetIconLabel(m.id, m.symbol)} size={44} />
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[13px] font-semibold tabular-nums ${
                        up ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"
                      }`}
                    >
                      <Arrow size={13} strokeWidth={2.25} />
                      {up ? "+" : ""}
                      {m.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="mt-5 min-w-0">
                    <p className="truncate text-[15px] text-black">{m.name}</p>
                    <p className="mt-1 text-[22px] font-medium leading-none tabular-nums tracking-[-0.02em] text-black">
                      ${m.price < 1 ? m.price.toFixed(4) : m.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="mt-1.5 text-xs uppercase tracking-wide text-black/35">{m.token}</p>
                  </div>
                </Link>
              );
            })}
      </div>
    </motion.section>
  );
}
