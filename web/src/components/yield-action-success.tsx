"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { useT } from "@/lib/i18n";

export interface ActionResult {
  kind: "deposit" | "withdraw";
  /** Human amount moved (e.g. 1.5 for $1.50). */
  amount: number;
  symbol: string;
  /** Cross-chain buy still bridging — credited in the background, not done yet. */
  pending?: boolean;
}

interface Props {
  result: ActionResult;
  onDone: () => void;
  /** Wallet address — links the receipt to on-chain proof (Solscan). */
  address?: string;
}

/**
 * Confirmation overlay shown after a deposit/withdraw lands on-chain. An animated
 * check + amount so the user has unmistakable feedback that the move happened.
 */
export function YieldActionSuccess({ result, onDone, address }: Props) {
  const { t } = useT();
  const verb = result.pending
    ? t("success.bridging")
    : result.kind === "deposit"
      ? t("success.deposited")
      : t("success.withdrew");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 rounded-[12px] bg-white px-6 text-center"
    >
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 14, stiffness: 240 }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full border border-[#3c05c7]/40 bg-[#3c05c7]/[0.08]"
      >
        <motion.span
          className="absolute inset-0 rounded-full border border-[#3c05c7]/40"
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
            className="text-[#3c05c7]"
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
        <p className="text-[10px] lowercase tracking-[0.2em] text-black/40">
          {verb}
        </p>
        <p className="mt-2 text-[40px] font-medium leading-none tracking-[-0.02em] text-black tabular-nums">
          ${result.amount.toFixed(2)}
        </p>
        <span className="mt-3 inline-block rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-[11px] lowercase tracking-wide text-black/55">
          {result.symbol}
        </span>
        {result.pending && (
          <p className="mt-2 max-w-[260px] text-[12px] leading-snug text-black/45">
            {t("success.bridgingBody")}
          </p>
        )}
      </motion.div>

      {/* On-chain proof — it's in your wallet, verifiable. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-center gap-4 text-[12px] lowercase tracking-wide text-black/50"
      >
        {!result.pending && (
          <Link href="/pile" className="underline-offset-2 hover:text-black hover:underline transition">
            {t("success.viewPosition")}
          </Link>
        )}
        {address && (
          <a
            href={`https://solscan.io/account/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 underline-offset-2 hover:text-black hover:underline transition"
          >
            {t("success.onSolscan")}
            <ArrowUpRight size={12} strokeWidth={1.5} />
          </a>
        )}
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.45 }}
        onClick={onDone}
        className="mt-1 px-6 py-2.5 rounded-full bg-black text-white text-[14px] font-medium lowercase tracking-wide hover:bg-black/85 transition"
      >
        {t("success.done")}
      </motion.button>
    </motion.div>
  );
}
