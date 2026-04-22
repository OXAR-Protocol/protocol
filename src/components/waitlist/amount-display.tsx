"use client";

import { useEffect, useRef, useState } from "react";

interface AmountDisplayProps {
  value: number;
}

function formatAmount(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function AmountDisplay({ value }: AmountDisplayProps) {
  const [displayed, setDisplayed] = useState(value);
  const rafRef = useRef<number | null>(null);
  const fromRef = useRef(value);
  const startRef = useRef(0);

  useEffect(() => {
    fromRef.current = displayed;
    startRef.current = performance.now();
    const duration = 260;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = fromRef.current + (value - fromRef.current) * eased;
      setDisplayed(current);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative text-center">
      <div className="font-sans font-normal text-white leading-none text-[clamp(2.8rem,9vw,4.5rem)] tracking-tight">
        {formatAmount(Math.round(displayed))}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
        reserved allocation
      </div>
    </div>
  );
}
