"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrivy } from "@privy-io/react-auth";
import { ArrowUpRight, Sparkles, Loader2 } from "lucide-react";

import { SectionLabel } from "@/components/section-label";
import { LiveAmount } from "@/components/live-amount";
import { LiveEarned } from "@/components/live-earned";
import { ActivityFeed } from "@/components/activity-feed";
import { useAggregatePersonalBalance } from "@/hooks/use-aggregate-balance";
import { useEarnings } from "@/hooks/use-earnings";
import { useStockPrices } from "@/hooks/use-stock-prices";
import { fromBaseUnits } from "@/lib/yield";
import { isXStock } from "@/lib/yield/xstocks";
import { isGold } from "@/lib/yield/gold";
import { isPriceExposure } from "@/lib/yield/assets";

/** Sum a set of earning sources into the inputs LiveEarned needs. */
function aggregate(sources: { currentValue: number; invested: number; apy: number }[]) {
  const value = sources.reduce((a, s) => a + s.currentValue, 0);
  const invested = sources.reduce((a, s) => a + s.invested, 0);
  const apy = value > 0 ? sources.reduce((a, s) => a + s.currentValue * s.apy, 0) / value : 0;
  return { value, invested, apy };
}

export default function HomePage() {
  const { user } = usePrivy();
  const { totalUsdc, blendedApy, positionCount, views, loading } =
    useAggregatePersonalBalance();
  // Real earnings already made (current value − on-chain cost basis), not a projection.
  // Split yield vs stocks — they're different products.
  const earnings = useEarnings();
  const yieldEarn = aggregate(earnings.sources.filter((s) => !isXStock(s.id) && !isGold(s.id)));
  const stockEarn = aggregate(earnings.sources.filter((s) => isXStock(s.id)));
  const goldEarn = aggregate(earnings.sources.filter((s) => isGold(s.id)));
  const [greeting, setGreeting] = useState("Welcome");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 6) setGreeting("Up late");
    else if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const handle = user?.email?.address
    ? user.email.address.split("@")[0]
    : user?.wallet?.address
      ? `${user.wallet.address.slice(0, 4)}…${user.wallet.address.slice(-4)}`
      : "friend";

  const activePositions = views.filter(
    (v) => Number(v.underlyingBalance) > 0,
  );

  // 24h price change for price-exposure positions (stocks/gold) — shown instead
  // of a meaningless "0.00% APY" on those cards.
  const priceMints = activePositions
    .filter((v) => isPriceExposure(v.id) && v.heldMint)
    .map((v) => v.heldMint as string);
  const { prices } = useStockPrices(priceMints);

  return (
    <div className="max-w-[1100px] mx-auto pt-8 pb-32">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SectionLabel>{`${greeting}, ${handle}`}</SectionLabel>
      </motion.div>

      {/* Balance hero */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-6 mb-12"
      >
        <p className="lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">
          your sleeping money
        </p>
        <div className="mt-3 flex items-baseline gap-4">
          {loading ? (
            <span className="text-[clamp(2rem,5vw,3rem)] font-light text-black/40 leading-none">
              <Loader2 className="animate-spin inline" size={28} />
            </span>
          ) : (
            <LiveAmount value={totalUsdc} apy={blendedApy} variant="hero" />
          )}
          {(yieldEarn.value > 0 || stockEarn.value > 0 || goldEarn.value > 0) && (
            <span className="text-sm text-[#3c05c7] flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {yieldEarn.value > 0 && (
                <span title="Earned from yield — current value minus what you put in, on-chain.">
                  <span className="text-black/45">yield</span>{" "}
                  <LiveEarned currentValue={yieldEarn.value} invested={yieldEarn.invested} apy={yieldEarn.apy} />
                </span>
              )}
              {stockEarn.value > 0 && (
                <span title="Earned from stocks — current value minus cost basis, on-chain.">
                  <span className="text-black/45">stocks</span>{" "}
                  <LiveEarned currentValue={stockEarn.value} invested={stockEarn.invested} apy={stockEarn.apy} />
                </span>
              )}
              {goldEarn.value > 0 && (
                <span title="Earned from gold — current value minus cost basis, on-chain.">
                  <span className="text-black/45">gold</span>{" "}
                  <LiveEarned currentValue={goldEarn.value} invested={goldEarn.invested} apy={goldEarn.apy} />
                </span>
              )}
            </span>
          )}
        </div>
        <p className="mt-3 text-sm text-black/45">
          {totalUsdc > 0
            ? `${positionCount} source${positionCount === 1 ? "" : "s"} · earning every block`
            : "drop USDC into a source to start earning"}
        </p>
      </motion.section>

      {/* Empty state — first-time hero */}
      {totalUsdc === 0 && !loading && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mb-12"
        >
          <div className="relative overflow-hidden rounded-[12px] border border-black/10 bg-white p-8 md:p-10">
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#3c05c7]/10 border border-[#3c05c7]/30 lowercase text-[10px] tracking-widest text-[#3c05c7]">
                <Sparkles size={10} strokeWidth={1.5} />
                start here
              </span>
              <h2 className="mt-4 text-2xl md:text-3xl text-black leading-tight lowercase">
                your money's been napping.
                <br />
                <span className="text-black/55">let's wake it up.</span>
              </h2>
              <p className="mt-3 text-sm text-black/45 max-w-md leading-relaxed">
                pick a source. deposit USDC. earn yield from day one. withdraw
                whenever you want — you always hold your own position.
              </p>
              <div className="mt-6">
                <Link
                  href="/yield"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 transition"
                >
                  wake up your money
                  <ArrowUpRight size={14} strokeWidth={1.5} />
                </Link>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Where it's sleeping — live positions */}
      {activePositions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-12"
        >
          <div className="flex items-baseline justify-between mb-4">
            <p className="lowercase text-[clamp(13px,1.1vw,16px)] text-black/45">
              where it's sleeping
            </p>
            <Link
              href="/pile"
              className="text-xs text-black/45 hover:text-black transition-colors"
            >
              manage →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activePositions.map((v) => {
              const value = fromBaseUnits(v.underlyingBalance, v.decimals);
              return (
                <Link
                  key={v.id}
                  href={`/asset/${v.id}`}
                  className="p-5 rounded-[12px] border border-black/10 bg-white hover:border-black/30 transition-colors min-h-[120px] flex flex-col justify-between"
                >
                  <div>
                    <p className="text-base text-black">{v.name}</p>
                    {(() => {
                      const ch = v.heldMint ? prices[v.heldMint]?.change24h : undefined;
                      if (isPriceExposure(v.id) && typeof ch === "number") {
                        const up = ch >= 0;
                        return (
                          <p className="mt-1 text-xs">
                            <span className={up ? "text-emerald-600" : "text-red-600"}>
                              {up ? "+" : ""}
                              {ch.toFixed(2)}% 24h
                            </span>
                            <span className="text-black/45"> · {v.assetSymbol}</span>
                          </p>
                        );
                      }
                      return (
                        <p className="mt-1 text-xs text-black/45">
                          {(v.apy * 100).toFixed(2)}% APY · {v.assetSymbol}
                        </p>
                      );
                    })()}
                  </div>
                  <LiveAmount value={value} apy={v.apy} variant="md" />
                </Link>
              );
            })}
          </div>
        </motion.section>
      )}

      {/* Activity placeholder */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35 }}
      >
        <p className="lowercase text-[clamp(13px,1.1vw,16px)] text-black/45 mb-4">
          recent activity
        </p>
        <ActivityFeed />
      </motion.section>
    </div>
  );
}
