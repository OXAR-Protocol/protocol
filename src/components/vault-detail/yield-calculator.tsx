"use client";

import { AnimatedNumber } from "@/components/animated-number";

interface YieldCalculatorProps {
  apyBps: number;
  amount: string;
  setAmount: (val: string) => void;
}

const PRESETS = [100, 1_000, 10_000];

export function YieldCalculator({
  apyBps,
  amount,
  setAmount,
}: YieldCalculatorProps) {
  const parsed = parseFloat(amount);
  const hasAmount = !isNaN(parsed) && parsed > 0;
  const yearly = hasAmount ? (parsed * apyBps) / 10_000 : 0;
  const monthly = yearly / 12;

  return (
    <div className="bg-surface-1 rounded-xl border border-white/[0.08] p-4">
      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="bg-surface-1 border border-white/[0.08] rounded-xl px-4 py-3 text-white font-mono text-lg w-full text-center focus:border-accent/50 focus:outline-none"
      />

      <div className="flex justify-center gap-2 mt-3">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset.toString())}
            className="font-mono text-xs px-3 py-1 rounded-full border border-white/[0.08] text-white/40 hover:border-accent/30 hover:text-white transition-all"
          >
            ${preset.toLocaleString()}
          </button>
        ))}
      </div>

      {hasAmount && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <p className="text-white/30 font-mono text-xs mb-1">1 month</p>
            <AnimatedNumber
              value={monthly}
              prefix="+$"
              decimals={2}
              className="text-profit font-mono text-lg font-bold"
            />
          </div>
          <div className="text-center">
            <p className="text-white/30 font-mono text-xs mb-1">1 year</p>
            <AnimatedNumber
              value={yearly}
              prefix="+$"
              decimals={2}
              className="text-profit font-mono text-lg font-bold"
            />
          </div>
        </div>
      )}
    </div>
  );
}
