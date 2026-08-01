"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowUpRight, Sparkles, Loader2 } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { LiveAmount } from "@/components/live-amount";
import { LiveEarned } from "@/components/live-earned";
import { WalletCash } from "@/components/wallet-cash";
import { PhotoBg } from "@/components/photo-bg";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useEarnings } from "@/hooks/use-earnings";
import { PortfolioPanel } from "@/components/portfolio-panel";
import { isXStock } from "@/lib/yield/xstocks";
import { isGold } from "@/lib/yield/gold";
import { useT } from "@/lib/i18n";

/** Sum a set of earning sources into the inputs LiveEarned needs. */
function aggregate(sources: { currentValue: number; invested: number; apy: number }[]) {
  const value = sources.reduce((a, s) => a + s.currentValue, 0);
  const invested = sources.reduce((a, s) => a + s.invested, 0);
  const apy = value > 0 ? sources.reduce((a, s) => a + s.currentValue * s.apy, 0) / value : 0;
  return { value, invested, apy };
}

export default function HomePage() {
  const { user } = usePrivy();
  const { totalUsdc, blendedApy, views, loading } =
    useAggregatePersonalBalance();
  // Real earnings already made (current value − on-chain cost basis), not a projection.
  // Split yield vs stocks — they're different products.
  const earnings = useEarnings();
  const yieldEarn = aggregate(earnings.sources.filter((s) => !isXStock(s.id) && !isGold(s.id)));
  const stockEarn = aggregate(earnings.sources.filter((s) => isXStock(s.id)));
  const goldEarn = aggregate(earnings.sources.filter((s) => isGold(s.id)));
  const { t } = useT();
  const [greetKey, setGreetKey] = useState<"greet.morning" | "greet.afternoon" | "greet.evening" | "greet.late" | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreetKey("greet.late");
    else if (hour < 12) setGreetKey("greet.morning");
    else if (hour < 18) setGreetKey("greet.afternoon");
    else setGreetKey("greet.evening");
  }, []);
  const greeting = greetKey ? t(greetKey) : "Welcome";

  const handle = user?.email?.address
    ? user.email.address.split("@")[0]
    : user?.wallet?.address
      ? `${user.wallet.address.slice(0, 4)}…${user.wallet.address.slice(-4)}`
      : "friend";

  const activePositions = views.filter(
    (v) => Number(v.underlyingBalance) > 0,
  );


  return (
    <div className="mx-auto max-w-[900px] pt-8 pb-32">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <SectionLabel>{`${greeting}, ${handle}`}</SectionLabel>
      </motion.div>

      {/* What's in the wallet leads: it is the money a person can act on right now,
          and the nudge to put it to work only makes sense before the figure that
          shows what already is. */}
      <WalletCash />

      {/* Balance hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative mt-6 mb-12 overflow-hidden rounded-[12px] border border-black/10 bg-white p-5"
        data-tour="balance"
      >
        {/* The photo belongs to the money that is alive. The wallet above is a plain
            statement of what is sitting still, and reads better bare. */}
        <PhotoBg
          src="/art/dripping-dollar.webp"
          scrim="left"
          position="object-[right_top]"
          zoomOnMobile
          opacity="opacity-30"
        />
        {/* ONE wrapper over everything, not `relative` sprinkled per child: the photo
            and its scrim are absolutely positioned, so any static sibling paints
            UNDER them. The "drop dollars into a source" line was added without it and
            vanished — half swallowed by the white scrim, half showing through the
            bill. A wrapper makes that impossible for whatever gets added next. */}
        <div className="relative">
        <p className="lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">
          {t("home.sleepingMoney")}
        </p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          {loading ? (
            <span className="text-[clamp(2rem,5vw,3rem)] font-light text-black/40 leading-none">
              <Loader2 className="animate-spin inline" size={28} />
            </span>
          ) : (
            <LiveAmount value={totalUsdc} apy={blendedApy} variant="lg" />
          )}
          {(yieldEarn.value > 0 || stockEarn.value > 0 || goldEarn.value > 0) && (
            <span className="text-sm text-[#3c05c7] flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {yieldEarn.value > 0 && (
                <span title="Earned from yield — current value minus what you put in, on-chain.">
                  <span className="text-black/45">{t("home.earned.yield")}</span>{" "}
                  <LiveEarned currentValue={yieldEarn.value} invested={yieldEarn.invested} apy={yieldEarn.apy} precision={6} />
                </span>
              )}
              {stockEarn.value > 0 && (
                <span title="Profit and loss on stocks: what they are worth now minus what you paid. Buying and selling on the market costs a spread, so a fresh position starts slightly negative.">
                  <span className="text-black/45">{t("home.earned.stocks")}</span>{" "}
                  <LiveEarned currentValue={stockEarn.value} invested={stockEarn.invested} apy={stockEarn.apy} />
                </span>
              )}
              {goldEarn.value > 0 && (
                <span title="Profit and loss on gold: what it is worth now minus what you paid. Buying and selling on the market costs a spread, so a fresh position starts slightly negative.">
                  <span className="text-black/45">{t("home.earned.gold")}</span>{" "}
                  <LiveEarned currentValue={goldEarn.value} invested={goldEarn.invested} apy={goldEarn.apy} />
                </span>
              )}
              {/* These are per-position and count from the day each was bought. The
                  card below answers a different question — the whole wallet over a
                  chosen window, including what has since been sold and what trading
                  cost — so without this the two read as one figure disagreeing. */}
              <span className="w-full text-[11px] lowercase text-black/35">
                {t("home.earned.scope")}
              </span>
            </span>
          )}
        </div>
        </div>
      </motion.section>


      {/* Empty state — first-time hero */}
      {totalUsdc === 0 && !loading && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-[16px] border border-black/10 bg-white">
            <PhotoBg src="/art/coin-stacking.webp" scrim="left" position="object-right" />
            <div className="relative p-8 md:p-10">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#3c05c7]/10 border border-[#3c05c7]/30 lowercase text-[10px] tracking-widest text-[#3c05c7]">
                <Sparkles size={10} strokeWidth={1.5} />
                {t("home.startHere")}
              </span>
              <h2 className="mt-4 text-2xl md:text-3xl text-black leading-tight lowercase">
                {t("home.napping1")}
                <br />
                <span className="text-black/55">{t("home.napping2")}</span>
              </h2>
              <p className="mt-3 text-sm text-black/55 max-w-md leading-relaxed">
                {t("home.empty.body")}
              </p>
              <div className="mt-6">
                <Link
                  href="/market"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 transition"
                >
                  {t("home.wakeUp")}
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Everything about the money you already have. Home used to carry a second,
          thinner copy of this list with a "manage" link to the page that held the
          real one — the same object shown twice, which is why home read as filler. */}
      {activePositions.length > 0 && <PortfolioPanel />}

    </div>
  );
}
