"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import { AssetIcon } from "@/components/asset-icon";
import { BanknoteBg } from "@/components/banknote-bg";
import { Skeleton } from "@/components/ui/skeleton";
import { assetLogoSrc, assetIconLabel } from "@/lib/yield/asset-logo";
import { useTopMovers } from "@/hooks/use-top-movers";
import { useAppReducedMotion, useRise } from "@/lib/motion";
import { useT } from "@/lib/i18n";

// Cards are sized so exactly 3 fit across on desktop (2 on tablet, ~1.3 on mobile).
const CARD_BASIS =
  "basis-[78%] sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)]";

/** How long a touch or a wheel buys before the strip starts moving on its own again. */
const RESUME_AFTER_MS = 6000;

/** Big, clear movers strip — 3 cards at a time, auto-advancing one card every 5s
 *  (pauses on hover), looping back at the end. Each card opens the asset page. */
export function TopMoversCarousel() {
  const { movers, loading } = useTopMovers(10);
  const { t } = useT();
  const rise = useRise();
  const reduced = useAppReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  /** Touch and wheel don't have a "leave" event, so they pause by deadline instead. */
  const pausedUntil = useRef(0);

  useEffect(() => {
    if (loading || movers.length <= 3) return;
    // Motion that starts by itself and never stops is the first thing a reduced-motion
    // setting is asking about. The strip is still there and still scrollable by hand.
    if (reduced) return;

    const el = scrollRef.current;
    if (!el) return;

    // Hovering paused it; touching it did not. `mouseenter` is the one pause signal
    // that no phone ever sends, so on the device most people are holding, the strip
    // kept sliding out from under the finger that was reading it.
    const hold = () => {
      pausedUntil.current = Date.now() + RESUME_AFTER_MS;
    };
    // Only user-initiated input counts. Listening to `scroll` instead would catch the
    // carousel's own smooth-scroll and pause it forever.
    el.addEventListener("touchstart", hold, { passive: true });
    el.addEventListener("wheel", hold, { passive: true });

    const id = setInterval(() => {
      if (paused.current || Date.now() < pausedUntil.current) return;
      const first = el.firstElementChild as HTMLElement | null;
      const step = first ? first.getBoundingClientRect().width + 16 : el.clientWidth / 3;
      // At the end → back to the start. Instantly: smooth-scrolling three cards
      // backwards past everything you just read announces itself as a component
      // resetting, where a cut just starts the loop again.
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "auto" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 5000);

    return () => {
      clearInterval(id);
      el.removeEventListener("touchstart", hold);
      el.removeEventListener("wheel", hold);
    };
  }, [loading, movers.length, reduced]);

  if (!loading && movers.length === 0) return null;

  return (
    <motion.section
      {...rise(1)}
      className="mb-12"
    >
      <div className="mb-4 flex items-baseline justify-between">
        <p className="lowercase text-[clamp(15px,1.4vw,20px)] tracking-[-0.02em] text-ink">
          {t("movers.title")}
        </p>
      </div>

      <div
        ref={scrollRef}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
        className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pt-2 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Skeleton
                key={i}
                className={`${CARD_BASIS} h-[168px] shrink-0 grow-0 rounded-panel border border-ink/10`}
              />
            ))
          : movers.map((m) => {
              const up = m.change24h >= 0;
              const Arrow = up ? ArrowUpRight : ArrowDownRight;
              return (
                <Link
                  key={m.id}
                  href={`/asset/${m.id}`}
                  // `hover:-translate-y-0.5` was ungated, so a tap on a phone left the
                  // card lifted until something else took focus — a touch fires a
                  // hover, and then never fires the leave. The lift is now a
                  // pointer-only affordance; touch gets the press feedback instead.
                  // `transition-all` narrowed to what is actually meant to move.
                  className={`${CARD_BASIS} group relative isolate flex shrink-0 grow-0 snap-start flex-col justify-between overflow-hidden rounded-panel border border-ink/10 bg-paper p-5 transition-[transform,border-color,box-shadow] duration-fast ease-out active:scale-[0.99] hover:border-ink/25 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)]`}
                >
                  <BanknoteBg seed={m.id} hover />
                  <div className="relative flex items-start justify-between">
                    <AssetIcon src={assetLogoSrc(m.id)} label={assetIconLabel(m.id, m.symbol)} size={44} />
                    <span
                      className={`inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-[13px] font-semibold tabular-nums ${
                        up ? "bg-emerald-500/10 text-profit" : "bg-red-500/10 text-loss"
                      }`}
                    >
                      <Arrow size={13} strokeWidth={2.25} />
                      {up ? "+" : ""}
                      {m.change24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="relative mt-5 min-w-0">
                    <p className="truncate text-[15px] text-ink">{m.name}</p>
                    <p className="mt-1 text-[22px] font-medium leading-none tabular-nums tracking-[-0.02em] text-ink">
                      ${m.price < 1 ? m.price.toFixed(4) : m.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="mt-1.5 text-xs uppercase tracking-wide text-ink/35">{m.token}</p>
                  </div>
                </Link>
              );
            })}
      </div>
    </motion.section>
  );
}
