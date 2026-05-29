"use client";

import { motion } from "framer-motion";

export interface ActionResult {
  kind: "deposit" | "withdraw";
  /** Human amount moved (e.g. 1.5 for $1.50). */
  amount: number;
  symbol: string;
}

interface Props {
  result: ActionResult;
  onDone: () => void;
}

/**
 * Confirmation overlay shown after a deposit/withdraw lands on-chain. An animated
 * check + amount so the user has unmistakable feedback that the move happened.
 */
export function YieldActionSuccess({ result, onDone }: Props) {
  const verb = result.kind === "deposit" ? "Deposited" : "Withdrew";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-[12px] bg-black px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 240 }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full border border-accent/40 bg-accent/[0.08]"
      >
        <motion.span
          className="absolute inset-0 rounded-full border border-accent/40"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <motion.path
            d="M11 20.5L17 26.5L29 13.5"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.45, delay: 0.15, ease: "easeInOut" }}
          />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
          {verb}
        </p>
        <p className="mt-2 font-sans text-3xl text-white tabular-nums">
          ${result.amount.toFixed(2)}
        </p>
        <p className="mt-1 font-mono text-xs text-white/40">{result.symbol}</p>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        onClick={onDone}
        className="mt-2 px-6 py-2.5 rounded-[5px] bg-white text-black font-mono text-xs uppercase tracking-wide hover:bg-white/90 transition"
      >
        Done
      </motion.button>
    </motion.div>
  );
}
