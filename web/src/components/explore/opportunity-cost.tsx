"use client";

import { useState, useEffect } from "react";

import { usePortfolio } from "@/hooks/use-portfolio";
import { AnimatedNumber } from "@/components/animated-number";
import { bnToDecimal } from "@/lib/format";

export function OpportunityCost() {
  const { usdcBalance, positions, loading } = usePortfolio();
  const [elapsed, setElapsed] = useState(0);

  const hasPositions = positions.length > 0;
  const usdcDollars = bnToDecimal(usdcBalance, 6);
  const hasUsdc = usdcDollars > 0;

  const dailyRate = hasPositions
    ? positions.reduce((sum, pos) => {
        const shares = bnToDecimal(pos.balance, 6);
        const nav = bnToDecimal(pos.vault.account.navPerShare, 6);
        // apyBps is bounded (<10000), safe to toNumber()
        const apy = pos.vault.account.apyBps.toNumber() / 10_000;
        return sum + (shares * nav * apy) / 365;
      }, 0)
    : (usdcDollars * 0.18) / 365;

  const perSecond = dailyRate / 86_400;

  useEffect(() => {
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyRate]);

  if (loading || (!hasPositions && !hasUsdc)) return null;

  const currentValue = perSecond * elapsed;
  const isEarning = hasPositions;

  return (
    <div className="flex items-center justify-between border-b border-white/[0.06] py-4 mb-6">
      <div className="flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isEarning ? "bg-profit animate-pulse" : "bg-loss"
          }`}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">
          {isEarning ? "Live · Earning now" : "Idle · USDC losing value"}
        </span>
      </div>
      <AnimatedNumber
        value={currentValue}
        prefix={isEarning ? "+$" : "-$"}
        decimals={6}
        className={`font-mono text-xs tabular-nums ${
          isEarning ? "text-profit" : "text-loss"
        }`}
      />
    </div>
  );
}
