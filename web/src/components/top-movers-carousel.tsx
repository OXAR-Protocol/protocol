"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useTopMovers } from "@/hooks/use-top-movers";
import { useT } from "@/lib/i18n";

// Cards are sized so exactly 3 fit across on desktop (2 on tablet, ~1.3 on mobile).
const CARD_BASIS =
  "basis-[78%] sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)]";

/** Big, clear movers strip — 3 cards at a time, auto-advancing one card every 5s
 *  (pauses on hover), looping back at the end. Each card opens the asset page. */
export function TopMoversCarousel() {
  const { movers, loading } = useTopMovers(10);
  const { t } = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);

  useEffect(() => {
    if (loading || movers.length <= 3) return;
    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el || paused.current) return;
      const first = el.firstElementChild as HTMLElement | null;
      const step = first ? first.getBoundingClientRect().width + 16 : el.clientWidth / 3;
      // At the end → loop to the start; otherwise advance one card.
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 5000);
    return () => clearInterval(id);
  }, [loading, movers.length]);

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

      <div
        ref={scrollRef}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pt-2 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className={`${CARD_BASIS} h-[168px] shrink-0 grow-0 animate-pulse rounded-[18px] border border-black/10 bg-black/[0.03]`}
              />
            ))
          : movers.map((m) => {
              const up = m.change24h >= 0;
              const Arrow = up ? ArrowUpRight : ArrowDownRight;
              return (
                <Link
                  key={m.id}
                  href={`/asset/${m.id}`}
                  className={`${CARD_BASIS} group relative isolate flex shrink-0 grow-0 snap-start flex-col justify-between overflow-hidden rounded-[18px] border border-black/10 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-black/25 hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]`}
                >
                  <BanknoteBg seed={m.id} />
                  <div className="relative flex items-start justify-between">
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
                  <div className="relative mt-5 min-w-0">
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
