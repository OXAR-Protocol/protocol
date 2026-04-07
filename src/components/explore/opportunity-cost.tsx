"use client";

import { useState, useEffect } from "react";

import { usePortfolio } from "@/hooks/use-portfolio";
import { AnimatedNumber } from "@/components/animated-number";

export function OpportunityCost() {
  const { usdcBalance, positions, loading } = usePortfolio();
  const [elapsed, setElapsed] = useState(0);

  const hasPositions = positions.length > 0;
  const usdcDollars = usdcBalance.toNumber() / 1_000_000;
  const hasUsdc = usdcDollars > 0;

  // Daily earning/loss rate
  const dailyRate = hasPositions
    ? positions.reduce((sum, pos) => {
        const shares = pos.balance.toNumber() / 1_000_000;
        const nav = pos.vault.account.navPerShare.toNumber() / 1_000_000;
        const apy = pos.vault.account.apyBps.toNumber() / 10_000;
        return sum + shares * nav * apy / 365;
      }, 0)
    : usdcDollars * 0.18 / 365;

  const perSecond = dailyRate / 86_400;

  useEffect(() => {
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [dailyRate]);

  // Don't render if loading, no wallet, or nothing to show
  if (loading || (!hasPositions && !hasUsdc)) return null;

  const currentValue = perSecond * elapsed;

  if (hasPositions) {
    return (
      <div className="space-y-1">
        <p className="font-mono text-sm text-white/40">Earning today</p>
        <AnimatedNumber
          value={currentValue}
          prefix="+$"
          decimals={6}
          className="text-2xl font-mono font-bold text-profit"
        />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <p className="font-mono text-sm text-white/40">Your USDC is losing</p>
      <AnimatedNumber
        value={currentValue}
        prefix="-$"
        decimals={6}
        className="text-2xl font-mono font-bold text-loss"
      />
    </div>
  );
}
