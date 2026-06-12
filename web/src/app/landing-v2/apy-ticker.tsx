"use client";

import { useEffect, useState } from "react";

// Prototype ticker. Production wires this to the live Jupiter Lend APY via
// the existing yield provider data path — never a hardcoded marketing number.
const BASE_APY = 4.21;

export function ApyTicker({ className = "" }: { className?: string }) {
  const [accrued, setAccrued] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setAccrued((a) => a + 0.000017), 900);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className={`font-mono tabular-nums text-amber-400/90 ${className}`}
      title="Live APY — Jupiter Lend USDC"
    >
      {(BASE_APY + accrued).toFixed(4)}% APY
    </span>
  );
}
