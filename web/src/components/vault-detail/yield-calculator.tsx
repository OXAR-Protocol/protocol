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
    <div className="rounded-[5px] border border-white/10 bg-surface-0 p-5">
      <label className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 block mb-3">
        Yield calculator
      </label>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="bg-transparent text-white font-mono text-3xl font-light w-full outline-none placeholder:text-white/15 text-center tabular-nums"
      />

      <div className="flex justify-center gap-2 mt-3">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setAmount(preset.toString())}
            className="font-mono text-[10px] uppercase tracking-wide px-3 py-1 rounded-full border border-white/10 text-white/40 hover:text-white hover:border-white/20 transition-colors"
          >
            ${preset.toLocaleString()}
          </button>
        ))}
      </div>

      {hasAmount && (
        <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/[0.06]">
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1.5">
              1 month
            </p>
            <AnimatedNumber
              value={monthly}
              prefix="+$"
              decimals={2}
              className="text-profit font-mono text-xl font-medium tabular-nums"
            />
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30 mb-1.5">
              1 year
            </p>
            <AnimatedNumber
              value={yearly}
              prefix="+$"
              decimals={2}
              className="text-profit font-mono text-xl font-medium tabular-nums"
            />
          </div>
        </div>
      )}
    </div>
  );
}
