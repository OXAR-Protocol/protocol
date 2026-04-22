"use client";

import { useMemo } from "react";

interface AmountSliderProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

// Exponential curve: slider 0..1 -> $100..$100,000+
const MIN = 100;
const MAX = 250_000;
const EXP = 3.5;

function fromSlider(t: number): number {
  const raw = MIN + (MAX - MIN) * Math.pow(t, EXP);
  if (raw < 1000) return Math.round(raw / 50) * 50;
  if (raw < 10_000) return Math.round(raw / 100) * 100;
  if (raw < 50_000) return Math.round(raw / 500) * 500;
  return Math.round(raw / 1000) * 1000;
}

function toSlider(v: number): number {
  const t = Math.pow(Math.max(0, (v - MIN) / (MAX - MIN)), 1 / EXP);
  return Math.min(1, Math.max(0, t));
}

const TICKS = [100, 1_000, 10_000, 50_000, 250_000];

export function AmountSlider({ value, onChange, disabled }: AmountSliderProps) {
  const sliderValue = useMemo(() => toSlider(value), [value]);

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
          Allocation
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
          USD
        </span>
      </div>

      <div className="relative h-10 flex items-center">
        {/* Track */}
        <div className="absolute left-0 right-0 h-px bg-white/15" />
        {/* Filled */}
        <div
          className="absolute left-0 h-px bg-white/50 transition-[width] duration-200 ease-out"
          style={{ width: `${sliderValue * 100}%` }}
        />

        {/* Tick marks */}
        {TICKS.map((t, i) => {
          const left = `${toSlider(t) * 100}%`;
          return (
            <div
              key={t}
              className="absolute -translate-x-1/2 flex flex-col items-center"
              style={{ left }}
            >
              <div className="w-px h-2 bg-white/30" />
              <span className="absolute top-4 font-mono text-[9px] text-white/30 whitespace-nowrap">
                {i === TICKS.length - 1 ? "250k+" : t >= 1000 ? `${t / 1000}k` : `$${t}`}
              </span>
            </div>
          );
        })}

        {/* Native range input, transparent, for accessibility */}
        <input
          type="range"
          min={0}
          max={1000}
          value={Math.round(sliderValue * 1000)}
          disabled={disabled}
          onChange={(e) => onChange(fromSlider(Number(e.target.value) / 1000))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Allocation amount"
        />

        {/* Custom thumb — crosshair */}
        <div
          className="absolute pointer-events-none -translate-x-1/2"
          style={{ left: `${sliderValue * 100}%` }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" className="text-white">
            <circle cx="9" cy="9" r="7.5" fill="black" stroke="currentColor" strokeWidth="1" />
            <path d="M9 3 V7 M9 11 V15 M3 9 H7 M11 9 H15" stroke="currentColor" strokeWidth="0.8" />
            <circle cx="9" cy="9" r="1" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}
